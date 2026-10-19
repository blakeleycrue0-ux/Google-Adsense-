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

const data = () => getStore({ name: DATA, consistency: "strong" });
const media = () => getStore({ name: MEDIA, consistency: "strong" });

const docKey = (c: string, id: string) => `d/${c}/${encodeURIComponent(id)}`;

export class BlobsAdapter implements DataAdapter {
  readonly kind = "netlify-blobs" as const;

  private async seeded(collection: CollectionName) {
    return (await data().get(`seeded/${collection}`)) !== null;
  }

  /** Antes de la primera escritura de una colección se materializa su contenido de demostración. */
  private async ensureSeeded(collection: CollectionName) {
    if (await this.seeded(collection)) return;
    const store = data();
    await Promise.all(seedCollection(collection).map((d) => store.setJSON(docKey(collection, d.id), d)));
    await store.set(`seeded/${collection}`, new Date().toISOString());
  }

  async list<K extends CollectionName>(collection: K): Promise<Collections[K][]> {
    if (!(await this.seeded(collection))) return seedCollection(collection);
    const store = data();
    const { blobs } = await store.list({ prefix: `d/${collection}/` });
    const docs: unknown[] = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
    return docs.filter((d) => d !== null) as Collections[K][];
  }

  async get<K extends CollectionName>(collection: K, id: string) {
    if (!(await this.seeded(collection))) return seedCollection(collection).find((d) => d.id === id) ?? null;
    return ((await data().get(docKey(collection, id), { type: "json" })) as Collections[K] | null) ?? null;
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
    return ((await data().get("settings", { type: "json" })) as Partial<Settings> | null) ?? null;
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
    const entry = await media().getWithMetadata(path, { type: "arrayBuffer" });
    if (!entry) return null;
    return { data: new Uint8Array(entry.data as ArrayBuffer), mime: String(entry.metadata?.mime ?? "application/octet-stream") };
  }
}
