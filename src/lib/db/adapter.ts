import type { CollectionName, Collections, Settings } from "@/lib/types";

/**
 * Contrato común de almacenamiento. Existen dos implementaciones:
 * - `file`: ficheros JSON en disco (desarrollo, demo y servidores con disco persistente).
 * - `supabase`: Postgres + Storage de Supabase (producción / serverless).
 */
export interface DataAdapter {
  readonly kind: "file" | "supabase";
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
}
