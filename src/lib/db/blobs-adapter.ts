import "server-only";
import { getStore } from "@netlify/blobs";
import type { CollectionName, Collections, Settings } from "@/lib/types";
import type { DataAdapter } from "./adapter";
import { seedCollection } from "@/data/seed";

/**
 * Almacenamiento en Netlify Blobs (tiendas de todo el sitio, compartidas entre
 * despliegues). Cada documento es una clave propia, de modo que guardar uno no
 * reescribe los demás. Los contadores se registran como claves de solo
 * escritura (sin leer-modificar-escribir) y se suman al consultarlos.
 *
 * Nota: las tiendas de sitio son comunes a todos los contextos (producción,
 * ramas y previsualizaciones), así que una previsualización ve y modifica los
 * mismos datos que producción.
 */
const DATA = "voltio-data";
const MEDIA = "voltio-media";

/**
 * Next.js intercepta fetch y pasa los GET por su caché de datos, que en Netlify
 * se guarda a su vez en Blobs: las lecturas se quedaban esperando. Con
 * «no-store» las peticiones del cliente de Blobs van directas.
 */
const directFetch: typeof fetch = (input, init) => fetch(input, { ...init, cache: "no-store" });

const data = () => getStore({ name: DATA, consistency: "strong", fetch: directFetch });
const media = () => getStore({ name: MEDIA, consistency: "strong", fetch: directFetch });

/**
 * En producción se ha visto que las lecturas con consistencia fuerte pueden no
 * responder. Si una tarda más de READ_TIMEOUT_MS, el proceso pasa a lecturas
 * eventuales (pueden ir hasta un minuto por detrás de la última escritura).
 */
const READ_TIMEOUT_MS = 3_000;
let strongReads = true;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | typeof TIMEOUT> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([p, new Promise<typeof TIMEOUT>((r) => (timer = setTimeout(() => r(TIMEOUT), ms)))]).finally(() => clearTimeout(timer));
}
const TIMEOUT = Symbol("timeout");

async function read<T>(name: string, op: (store: ReturnType<typeof getStore>) => Promise<T>): Promise<T> {
  if (strongReads) {
    const r = await withTimeout(op(getStore({ name, consistency: "strong", fetch: directFetch })), READ_TIMEOUT_MS);
    if (r !== TIMEOUT) return r;
    strongReads = false;
    console.warn("[voltio-blobs] lectura fuerte sin respuesta en 3 s: se usan lecturas eventuales");
  }
  const r = await withTimeout(op(getStore({ name, fetch: directFetch })), READ_TIMEOUT_MS * 2);
  if (r === TIMEOUT) throw new Error("Netlify Blobs no responde");
  return r;
}

const readJson = (key: string) => read(DATA, (s) => s.get(key, { type: "json" }) as Promise<unknown>);

const docKey = (c: string, id: string) => `d/${c}/${encodeURIComponent(id)}`;

export class BlobsAdapter implements DataAdapter {
  readonly kind = "netlify-blobs" as const;

  /** Una colección sembrada no deja de estarlo: se recuerda para ahorrar lecturas. */
  private seededCache = new Set<CollectionName>();

  private async seeded(collection: CollectionName) {
    if (this.seededCache.has(collection)) return true;
    const ok = (await read(DATA, (s) => s.get(`seeded/${collection}`))) !== null;
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
        const store = data();
        await Promise.all(seedCollection(collection).map((d) => store.setJSON(docKey(collection, d.id), d)));
        await store.set(`seeded/${collection}`, new Date().toISOString());
        this.seededCache.add(collection);
      })();
      this.seeding.set(collection, pending);
      pending.catch(() => this.seeding.delete(collection));
    }
    return pending;
  }

  async list<K extends CollectionName>(collection: K): Promise<Collections[K][]> {
    if (!(await this.seeded(collection))) return seedCollection(collection);
    const { blobs } = await data().list({ prefix: `d/${collection}/` });
    const docs: unknown[] = await Promise.all(blobs.map((b) => readJson(b.key)));
    return docs.filter((d) => d !== null) as Collections[K][];
  }

  async get<K extends CollectionName>(collection: K, id: string) {
    if (!(await this.seeded(collection))) return seedCollection(collection).find((d) => d.id === id) ?? null;
    return ((await readJson(docKey(collection, id))) as Collections[K] | null) ?? null;
  }

  async put<K extends CollectionName>(collection: K, doc: Collections[K]) {
    await this.ensureSeeded(collection);
    await data().setJSON(docKey(collection, doc.id), doc);
  }

  async remove<K extends CollectionName>(collection: K, id: string) {
    await this.ensureSeeded(collection);
    await data().delete(docKey(collection, id));
  }

  async getSettings() {
    return ((await readJson("settings")) as Partial<Settings> | null) ?? null;
  }

  async saveSettings(settings: Settings) {
    await data().setJSON("settings", settings);
  }

  async increment(key: string, by = 1) {
    await data().set(`c/${key}/${by}-${crypto.randomUUID()}`, "");
  }

  async counters(prefix: string) {
    const { blobs } = await data().list({ prefix: `c/${prefix}` });
    const out: Record<string, number> = {};
    for (const b of blobs) {
      const rest = b.key.slice(2);
      const slash = rest.lastIndexOf("/");
      const name = rest.slice(0, slash);
      const by = Number(rest.slice(slash + 1).split("-")[0]) || 1;
      out[name] = (out[name] ?? 0) + by;
    }
    return out;
  }

  async uploadFile(path: string, file: Buffer, mime: string) {
    await media().set(path, new Uint8Array(file).buffer as ArrayBuffer, { metadata: { mime } });
    return `/uploads/${path}`;
  }

  async deleteFile(path: string) {
    await media().delete(path);
  }

  async readUpload(path: string) {
    const entry = await read(MEDIA, (s) => s.getWithMetadata(path, { type: "arrayBuffer" }));
    if (!entry) return null;
    return { data: new Uint8Array(entry.data as ArrayBuffer), mime: String(entry.metadata?.mime ?? "application/octet-stream") };
  }
}
