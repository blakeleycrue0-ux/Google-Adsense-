import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CollectionName, Collections, Settings } from "@/lib/types";
import type { DataAdapter } from "./adapter";

const BUCKET = "media";

export function supabaseClient(url: string, serviceKey: string) {
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Almacenamiento en Supabase (ver supabase/schema.sql). Usa la clave
 * service_role solo en el servidor; las tablas tienen RLS sin políticas
 * públicas. Las fotos van al bucket público «media».
 */
export class SupabaseAdapter implements DataAdapter {
  readonly kind = "supabase" as const;
  private client: SupabaseClient;

  constructor(url: string, serviceKey: string) {
    this.client = supabaseClient(url, serviceKey);
  }

  async list<K extends CollectionName>(collection: K): Promise<Collections[K][]> {
    const rows: Collections[K][] = [];
    const page = 1000;
    for (let from = 0; ; from += page) {
      const { data, error } = await this.client
        .from("documents")
        .select("data")
        .eq("collection", collection)
        .range(from, from + page - 1);
      if (error) throw new Error(`Supabase (${collection}): ${error.message}`);
      rows.push(...(data ?? []).map((r) => r.data as Collections[K]));
      if (!data || data.length < page) break;
    }
    return rows;
  }

  async get<K extends CollectionName>(collection: K, id: string) {
    const { data, error } = await this.client.from("documents").select("data").eq("collection", collection).eq("id", id).maybeSingle();
    if (error) throw new Error(`Supabase (${collection}): ${error.message}`);
    return (data?.data as Collections[K]) ?? null;
  }

  async put<K extends CollectionName>(collection: K, doc: Collections[K]) {
    const { error } = await this.client.from("documents").upsert({ collection, id: doc.id, data: doc, updated_at: new Date().toISOString() });
    if (error) throw new Error(`Supabase (${collection}): ${error.message}`);
  }

  async remove<K extends CollectionName>(collection: K, id: string) {
    const { error } = await this.client.from("documents").delete().eq("collection", collection).eq("id", id);
    if (error) throw new Error(`Supabase (${collection}): ${error.message}`);
  }

  async getSettings() {
    const { data, error } = await this.client.from("documents").select("data").eq("collection", "settings").eq("id", "site").maybeSingle();
    if (error) throw new Error(`Supabase (settings): ${error.message}`);
    return (data?.data as Partial<Settings>) ?? null;
  }

  async saveSettings(settings: Settings) {
    const { error } = await this.client.from("documents").upsert({ collection: "settings", id: "site", data: settings, updated_at: new Date().toISOString() });
    if (error) throw new Error(`Supabase (settings): ${error.message}`);
  }

  async uploadFile(path: string, data: Buffer, mime: string) {
    const { error } = await this.client.storage.from(BUCKET).upload(path, data, { contentType: mime, upsert: false, cacheControl: "31536000" });
    if (error) throw new Error(`Supabase Storage: ${error.message}`);
    return this.client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async deleteFile(path: string) {
    await this.client.storage.from(BUCKET).remove([path]);
  }

  async readUpload(path: string) {
    const { data } = await this.client.storage.from(BUCKET).download(path);
    if (!data) return null;
    return { data: new Uint8Array(await data.arrayBuffer()), mime: data.type || "image/webp" };
  }
}
