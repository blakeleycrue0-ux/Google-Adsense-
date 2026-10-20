import "server-only";
import type { CollectionName, Collections, Settings } from "@/lib/types";
import type { DataAdapter } from "./adapter";
import { runBlobOp, type BlobOp } from "./blobs-ops";
import { seedCollection } from "@/data/seed";

/**
 * Almacenamiento en Netlify Blobs (tiendas de todo el sitio, compartidas entre
 * despliegues). Cada documento es una clave propia, de modo que guardar uno no
 * reescribe los demás. Los contadores se registran como claves de solo
 * escritura (sin leer-modificar-escribir) y se suman al consultarlos.
 *
 * Dentro del servidor de Next.js de Netlify las lecturas de Blobs no responden
 * (escribir y listar sí); en una función independiente funcionan. Por eso, en
 * Netlify cada operación se hace a través de netlify/functions/voltio-store.
 *
 * Nota: las tiendas de sitio son comunes a todos los contextos (producción,
 * ramas y previsualizaciones), así que una previsualización ve y modifica los
 * mismos datos que producción.
 */

const FUNCTION_PATH = "/.netlify/functions/voltio-store";

/** fetch sin el parche de caché de Next.js. */
function rawFetch(input: string, init: RequestInit) {
  const original = (globalThis.fetch as typeof fetch & { _nextOriginalFetch?: typeof fetch })._nextOriginalFetch;
  return (original ?? fetch)(input, { ...init, cache: "no-store" });
}

/** URL de la función en Netlify; sin ella (pruebas, local) se accede a Blobs directamente. */
function functionUrl() {
  if (process.env.VITEST) return null;
  const base = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL;
  return base ? `${base.replace(/\/$/, "")}${FUNCTION_PATH}` : null;
}

async function call<T>(op: BlobOp): Promise<T> {
  const url = functionUrl();
  if (!url) return (await runBlobOp(op)) as T;
  const res = await rawFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` },
    body: JSON.stringify(op),
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => null)) as { result?: unknown; error?: string } | null;
  if (!res.ok) throw new Error(`Almacenamiento (Netlify Blobs): ${body?.error ?? `HTTP ${res.status}`}`);
  return body?.result as T;
}

const docKey = (c: string, id: string) => `d/${c}/${encodeURIComponent(id)}`;

export class BlobsAdapter implements DataAdapter {
  readonly kind = "netlify-blobs" as const;

  /** Una colección sembrada no deja de estarlo: se recuerda para ahorrar lecturas. */
  private seededCache = new Set<CollectionName>();

  private async seeded(collection: CollectionName) {
    if (this.seededCache.has(collection)) return true;
    const ok = await call<boolean>({ op: "exists", store: "data", key: `seeded/${collection}` });
    if (ok) this.seededCache.add(collection);
    return ok;
  }

  private seeding = new Map<CollectionName, Promise<void>>();

  /**
   * Antes de la primera escritura de una colección se materializa su contenido
   * de demostración. Las escrituras simultáneas comparten una única siembra.
   */
  private ensureSeeded(collection: CollectionName) {
    let pending = this.seeding.get(collection);
    if (!pending) {
      pending = (async () => {
        if (await this.seeded(collection)) return;
        await Promise.all(seedCollection(collection).map((d) => call({ op: "setJSON", store: "data", key: docKey(collection, d.id), value: d })));
        await call({ op: "setText", store: "data", key: `seeded/${collection}`, value: new Date().toISOString() });
        this.seededCache.add(collection);
      })();
      this.seeding.set(collection, pending);
      pending.catch(() => this.seeding.delete(collection));
    }
    return pending;
  }

  async list<K extends CollectionName>(collection: K): Promise<Collections[K][]> {
    if (!(await this.seeded(collection))) return seedCollection(collection);
    return call<Collections[K][]>({ op: "listJSON", store: "data", prefix: `d/${collection}/` });
  }

  async get<K extends CollectionName>(collection: K, id: string) {
    if (!(await this.seeded(collection))) return seedCollection(collection).find((d) => d.id === id) ?? null;
    return (await call<Collections[K] | null>({ op: "getJSON", store: "data", key: docKey(collection, id) })) ?? null;
  }

  async put<K extends CollectionName>(collection: K, doc: Collections[K]) {
    await this.ensureSeeded(collection);
    await call({ op: "setJSON", store: "data", key: docKey(collection, doc.id), value: doc });
  }

  async remove<K extends CollectionName>(collection: K, id: string) {
    await this.ensureSeeded(collection);
    await call({ op: "delete", store: "data", key: docKey(collection, id) });
  }

  async getSettings() {
    return (await call<Partial<Settings> | null>({ op: "getJSON", store: "data", key: "settings" })) ?? null;
  }

  async saveSettings(settings: Settings) {
    await call({ op: "setJSON", store: "data", key: "settings", value: settings });
  }

  async increment(key: string, by = 1) {
    await call({ op: "setText", store: "data", key: `c/${key}/${by}-${crypto.randomUUID()}`, value: "" });
  }

  async counters(prefix: string) {
    const keys = await call<string[]>({ op: "listKeys", store: "data", prefix: `c/${prefix}` });
    const out: Record<string, number> = {};
    for (const k of keys) {
      const rest = k.slice(2);
      const slash = rest.lastIndexOf("/");
      const name = rest.slice(0, slash);
      const by = Number(rest.slice(slash + 1).split("-")[0]) || 1;
      out[name] = (out[name] ?? 0) + by;
    }
    return out;
  }

  async uploadFile(path: string, file: Buffer, mime: string) {
    await call({ op: "setBinary", store: "media", key: path, base64: Buffer.from(file).toString("base64"), metadata: { mime } });
    return `/uploads/${path}`;
  }

  async deleteFile(path: string) {
    await call({ op: "delete", store: "media", key: path });
  }

  async readUpload(path: string) {
    const entry = await call<{ base64: string; metadata: Record<string, unknown> } | null>({ op: "getBinary", store: "media", key: path });
    if (!entry) return null;
    const buf = Buffer.from(entry.base64, "base64");
    return { data: new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer), mime: String(entry.metadata?.mime ?? "application/octet-stream") };
  }
}
