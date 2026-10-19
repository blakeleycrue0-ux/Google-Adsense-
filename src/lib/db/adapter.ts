import type { CollectionName, Collections, Settings } from "@/lib/types";

/**
 * Contrato común de almacenamiento. Implementaciones:
 * - `file`: ficheros JSON en disco (desarrollo, demo y servidores con disco persistente).
 * - `netlify-blobs`: Netlify Blobs (despliegues en Netlify, sin servicios externos).
 * - `supabase`: Postgres + Storage de Supabase (producción en cualquier plataforma).
 */
export interface DataAdapter {
  readonly kind: "file" | "netlify-blobs" | "supabase";
  list<K extends CollectionName>(collection: K): Promise<Collections[K][]>;
  get<K extends CollectionName>(collection: K, id: string): Promise<Collections[K] | null>;
  put<K extends CollectionName>(collection: K, doc: Collections[K]): Promise<void>;
  remove<K extends CollectionName>(collection: K, id: string): Promise<void>;
  getSettings(): Promise<Partial<Settings> | null>;
  saveSettings(settings: Settings): Promise<void>;
  increment(key: string, by?: number): Promise<void>;
  /** Devuelve los contadores cuyo nombre empieza por `prefix`. */
  counters(prefix: string): Promise<Record<string, number>>;
  uploadFile(path: string, data: Buffer, mime: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
  /** Lectura de un archivo subido (adaptadores que no exponen URL pública propia). */
  readUpload?(path: string): Promise<{ data: Uint8Array<ArrayBuffer>; mime: string } | null>;
}
