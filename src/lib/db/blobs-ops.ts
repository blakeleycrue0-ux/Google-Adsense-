import { getStore } from "@netlify/blobs";

/**
 * Operaciones de Netlify Blobs serializables en JSON. Las ejecuta la función
 * netlify/functions/store (fuera de Next.js, donde las lecturas de Blobs sí
 * responden). Sin dependencias de Next.js ni de «server-only».
 */

export const STORES = { data: "baleares-data", media: "baleares-media" } as const;
export type StoreId = keyof typeof STORES;

export type BlobOp =
  | { op: "getJSON"; store: StoreId; key: string }
  | { op: "listJSON"; store: StoreId; prefix: string }
  | { op: "setJSON"; store: StoreId; key: string; value: unknown }
  | { op: "delete"; store: StoreId; key: string }
  | { op: "setBinary"; store: StoreId; key: string; base64: string; metadata?: Record<string, string> }
  | { op: "getBinary"; store: StoreId; key: string };

const OPS = new Set(["getJSON", "listJSON", "setJSON", "delete", "setBinary", "getBinary"]);

/** Valida una operación recibida por HTTP: tienda conocida y claves acotadas. */
export function isBlobOp(v: unknown): v is BlobOp {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.op !== "string" || !OPS.has(o.op) || typeof o.store !== "string" || !(o.store in STORES)) return false;
  const key = o.op === "listJSON" ? o.prefix : o.key;
  return typeof key === "string" && key.length <= 512 && !key.includes("..");
}

const store = (id: StoreId) => getStore({ name: STORES[id], consistency: "strong" });

export async function runBlobOp(o: BlobOp): Promise<unknown> {
  const s = store(o.store);
  switch (o.op) {
    case "getJSON":
      return (await s.get(o.key, { type: "json" })) ?? null;
    case "listJSON": {
      const { blobs } = await s.list({ prefix: o.prefix });
      const values = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" })));
      return values.filter((v) => v !== null);
    }
    case "setJSON":
      await s.setJSON(o.key, o.value);
      return null;
    case "delete":
      await s.delete(o.key);
      return null;
    case "setBinary": {
      const buf = Buffer.from(o.base64, "base64");
      await s.set(o.key, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, { metadata: o.metadata ?? {} });
      return null;
    }
    case "getBinary": {
      const entry = await s.getWithMetadata(o.key, { type: "arrayBuffer" });
      if (!entry) return null;
      return { base64: Buffer.from(entry.data as ArrayBuffer).toString("base64"), metadata: entry.metadata ?? {} };
    }
  }
}
