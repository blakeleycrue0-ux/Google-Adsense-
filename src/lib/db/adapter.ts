import type { CollectionName, Collections, Settings } from "@/lib/types";

/**
 * Contrato común de almacenamiento. Implementaciones:
 * - `file`: ficheros JSON en disco (desarrollo y servidores con disco persistente).
 * - `netlify-blobs`: Netlify Blobs (la web publicada en Netlify, sin servicios externos).
 */
export interface DataAdapter {
  readonly kind: "file" | "netlify-blobs";
  list<K extends CollectionName>(collection: K): Promise<Collections[K][]>;
  get<K extends CollectionName>(collection: K, id: string): Promise<Collections[K] | null>;
  put<K extends CollectionName>(collection: K, doc: Collections[K]): Promise<void>;
  remove<K extends CollectionName>(collection: K, id: string): Promise<void>;
  getSettings(): Promise<Partial<Settings> | null>;
  saveSettings(settings: Settings): Promise<void>;
  /** Guarda un archivo y devuelve su URL pública (/uploads/…). */
  uploadFile(path: string, data: Buffer, mime: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
  readUpload(path: string): Promise<{ data: Uint8Array<ArrayBuffer>; mime: string } | null>;
}
