import { beforeEach, describe, expect, it, vi } from "vitest";

// Almacén en memoria con la misma interfaz que usa el adaptador (no es Netlify real).
const stores = new Map<string, Map<string, { value: unknown; metadata?: Record<string, unknown> }>>();
vi.mock("@netlify/blobs", () => ({
  getStore: ({ name }: { name: string }) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const s = stores.get(name)!;
    return {
      get: async (k: string, o?: { type?: string }) => {
        const e = s.get(k);
        if (!e) return null;
        return o?.type === "json" ? JSON.parse(e.value as string) : e.value;
      },
      getWithMetadata: async (k: string) => {
        const e = s.get(k);
        return e ? { data: e.value, metadata: e.metadata ?? {} } : null;
      },
      set: async (k: string, v: unknown, o?: { metadata?: Record<string, unknown> }) => void s.set(k, { value: v, metadata: o?.metadata }),
      setJSON: async (k: string, v: unknown) => void s.set(k, { value: JSON.stringify(v) }),
      delete: async (k: string) => void s.delete(k),
      list: async ({ prefix = "" }: { prefix?: string } = {}) => ({ blobs: [...s.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key, etag: "x" })) }),
    };
  },
}));

const { BlobsAdapter } = await import("@/lib/db/blobs-adapter");
const { seedCollection } = await import("@/data/seed");

describe("adaptador Netlify Blobs", () => {
  beforeEach(() => stores.clear());

  it("devuelve la demostración hasta la primera escritura y luego la conserva", async () => {
    const a = new BlobsAdapter();
    const seed = seedCollection("posts");
    expect((await a.list("posts")).length).toBe(seed.length);
    await a.put("posts", { ...seed[0], title: "Editado" });
    const after = await a.list("posts");
    expect(after.length).toBe(seed.length);
    expect(after.find((p) => p.id === seed[0].id)?.title).toBe("Editado");
    await a.remove("posts", seed[1].id);
    expect((await a.list("posts")).length).toBe(seed.length - 1);
  });

  it("suma contadores de solo escritura por prefijo", async () => {
    const a = new BlobsAdapter();
    await a.increment("views:d:2026-10-19:post-1");
    await a.increment("views:d:2026-10-19:post-1");
    await a.increment("views:d:2026-10-19:post-2", 3);
    await a.increment("clicks:total:x");
    expect(await a.counters("views:d:")).toEqual({ "views:d:2026-10-19:post-1": 2, "views:d:2026-10-19:post-2": 3 });
  });

  it("guarda y lee archivos subidos con su tipo", async () => {
    const a = new BlobsAdapter();
    const url = await a.uploadFile("2026/10/foto.webp", Buffer.from([1, 2, 3]), "image/webp");
    expect(url).toBe("/uploads/2026/10/foto.webp");
    const f = await a.readUpload("2026/10/foto.webp");
    expect(f?.mime).toBe("image/webp");
    expect([...f!.data]).toEqual([1, 2, 3]);
  });
});
