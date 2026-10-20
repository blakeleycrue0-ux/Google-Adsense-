import "server-only";
import type { CollectionName, Collections, Settings } from "@/lib/types";
import type { DataAdapter } from "./adapter";
import { runBlobOp, type BlobOp } from "./blobs-ops";

/**
 * Almacenamiento en Netlify Blobs. Cada documento es una clave propia, así que
 * guardar uno no reescribe los demás.
 *
 * Dentro del servidor de Next.js de Netlify las lecturas de Blobs no responden
 * (probado en producción); en una función independiente sí. Por eso cada
 * operación pasa por netlify/functions/store, protegida con STORE_SECRET.
 */

const FUNCTION_PATH = "/.netlify/functions/store";

export const storeSecret = () => process.env.STORE_SECRET || process.env.CRON_SECRET || "";

/** fetch sin el parche de caché de Next.js. */
function rawFetch(input: string, init: RequestInit) {
  const original = (globalThis.fetch as typeof fetch & { _nextOriginalFetch?: typeof fetch })._nextOriginalFetch;
  return (original ?? fetch)(input, { ...init, cache: "no-store" });
}

/** URL de la función en Netlify; sin ella (pruebas) se accede a Blobs directamente. */
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
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${storeSecret()}` },
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

  list<K extends CollectionName>(collection: K) {
    return call<Collections[K][]>({ op: "listJSON", store: "data", prefix: `d/${collection}/` });
  }

  async get<K extends CollectionName>(collection: K, id: string) {
    return (await call<Collections[K] | null>({ op: "getJSON", store: "data", key: docKey(collection, id) })) ?? null;
  }

  async put<K extends CollectionName>(collection: K, doc: Collections[K]) {
    await call({ op: "setJSON", store: "data", key: docKey(collection, doc.id), value: doc });
  }

  async remove<K extends CollectionName>(collection: K, id: string) {
    await call({ op: "delete", store: "data", key: docKey(collection, id) });
  }

  async getSettings() {
    return (await call<Partial<Settings> | null>({ op: "getJSON", store: "data", key: "settings" })) ?? null;
  }

  async saveSettings(settings: Settings) {
    await call({ op: "setJSON", store: "data", key: "settings", value: settings });
  }

  async uploadFile(path: string, file: Buffer, mime: string) {
    await call({ op: "setBinary", store: "media", key: path, base64: file.toString("base64"), metadata: { mime } });
    return `/uploads/${path}`;
  }

  async deleteFile(path: string) {
    await call({ op: "delete", store: "media", key: path });
  }

  async readUpload(path: string) {
    const entry = await call<{ base64: string; metadata: Record<string, unknown> } | null>({ op: "getBinary", store: "media", key: path });
    if (!entry) return null;
    const buf = Buffer.from(entry.base64, "base64");
    return { data: new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer), mime: String(entry.metadata?.mime ?? "image/webp") };
  }
}
