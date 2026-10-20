import { getStore } from "@netlify/blobs";

/**
 * Operaciones de Netlify Blobs que usa Voltio, serializables en JSON. Las
 * ejecuta la función netlify/functions/voltio-store (fuera de Next.js, donde
 * Blobs funciona) y, en pruebas, el propio adaptador directamente.
 * Sin dependencias de Next.js ni de «server-only».
 */

export const STORES = { data: "voltio-data", media: "voltio-media" } as const;
export type StoreId = keyof typeof STORES;

export type BlobOp =
  | { op: "getJSON"; store: StoreId; key: string }
  | { op: "exists"; store: StoreId; key: string }
  | { op: "listKeys"; store: StoreId; prefix: string }
  | { op: "listJSON"; store: StoreId; prefix: string }
  | { op: "setJSON"; store: StoreId; key: string; value: unknown }
  | { op: "setText"; store: StoreId; key: string; value: string }
  | { op: "delete"; store: StoreId; key: string }
  | { op: "setBinary"; store: StoreId; key: string; base64: string; metadata?: Record<string, string> }
  | { op: "getBinary"; store: StoreId; key: string };

const OPS = new Set(["getJSON", "exists", "listKeys", "listJSON", "setJSON", "setText", "delete", "setBinary", "getBinary"]);

/** Valida una operación recibida por HTTP: tienda conocida y claves acotadas. */
export function isBlobOp(v: unknown): v is BlobOp {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.op !== "string" || !OPS.has(o.op) || typeof o.store !== "string" || !(o.store in STORES)) return false;
  const key = o.op === "listKeys" || o.op === "listJSON" ? o.prefix : o.key;
  return typeof key === "string" && key.length <= 512 && !key.includes("..");
}

const store = (id: StoreId) => getStore({ name: STORES[id], consistency: "strong" });

export async function runBlobOp(o: BlobOp): Promise<unknown> {
  const s = store(o.store);
  switch (o.op) {
    case "getJSON":
      return (await s.get(o.key, { type: "json" })) ?? null;
    case "exists":
      return (await s.get(o.key)) !== null;
    case "listKeys":
      return (await s.list({ prefix: o.prefix })).blobs.map((b) => b.key);
    case "listJSON": {
      const { blobs } = await s.list({ prefix: o.prefix });
      const values = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" })));
      return values.filter((v) => v !== null);
    }
    case "setJSON":
      await s.setJSON(o.key, o.value);
      return null;
    case "setText":
      await s.set(o.key, o.value);
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
