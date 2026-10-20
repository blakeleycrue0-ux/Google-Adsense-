import { beforeEach, describe, expect, it, vi } from "vitest";

// Almacén en memoria con la interfaz de @netlify/blobs que usa blobs-ops (no es Netlify real).
const stores = new Map<string, Map<string, unknown>>();
vi.mock("@netlify/blobs", () => ({
  getStore: ({ name }: { name: string }) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const s = stores.get(name)!;
    return {
      get: async (k: string, o?: { type?: string }) => (s.has(k) ? (o?.type === "json" ? JSON.parse(s.get(k) as string) : s.get(k)) : null),
      setJSON: async (k: string, v: unknown) => void s.set(k, JSON.stringify(v)),
      set: async (k: string, v: unknown) => void s.set(k, v),
      delete: async (k: string) => void s.delete(k),
      list: async ({ prefix = "" } = {}) => ({ blobs: [...s.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key })) }),
    };
  },
}));
vi.stubGlobal("Netlify", { env: { get: (k: string) => (k === "CRON_SECRET" ? "secreto" : undefined) } });

const { default: handler } = await import("../netlify/functions/voltio-store.mjs");
const post = (body: unknown, auth = "Bearer secreto") =>
  handler(new Request("https://voltio.test/.netlify/functions/voltio-store", { method: "POST", headers: { authorization: auth }, body: JSON.stringify(body) }));

describe("función voltio-store", () => {
  beforeEach(() => stores.clear());

  it("rechaza peticiones sin la clave del servidor", async () => {
    expect((await post({ op: "getJSON", store: "data", key: "x" }, "Bearer otra")).status).toBe(401);
  });

  it("rechaza operaciones o tiendas desconocidas", async () => {
    expect((await post({ op: "drop", store: "data", key: "x" })).status).toBe(400);
    expect((await post({ op: "getJSON", store: "otra", key: "x" })).status).toBe(400);
    expect((await post({ op: "getJSON", store: "data", key: "../x" })).status).toBe(400);
  });

  it("guarda, lee y lista documentos", async () => {
    await post({ op: "setJSON", store: "data", key: "d/devices/a", value: { id: "a", n: 1 } });
    expect(await (await post({ op: "getJSON", store: "data", key: "d/devices/a" })).json()).toEqual({ result: { id: "a", n: 1 } });
    expect(await (await post({ op: "listJSON", store: "data", prefix: "d/devices/" })).json()).toEqual({ result: [{ id: "a", n: 1 }] });
    expect(await (await post({ op: "getJSON", store: "data", key: "d/devices/b" })).json()).toEqual({ result: null });
  });
});
