import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CollectionName, Collections, Settings } from "@/lib/types";
import type { DataAdapter } from "./adapter";

const BUCKET = process.env.SUPABASE_MEDIA_BUCKET || "media";

/**
 * Adaptador para Supabase. Usa la clave `service_role` exclusivamente en el
 * servidor; las tablas tienen RLS activado sin políticas públicas (ver
 * `supabase/schema.sql`), por lo que nada es accesible desde el navegador.
 */
export class SupabaseAdapter implements DataAdapter {
  readonly kind = "supabase" as const;
  private client: SupabaseClient;

  constructor(url: string, serviceKey: string) {
    this.client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
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
    const { data, error } = await this.client
      .from("documents")
      .select("data")
      .eq("collection", collection)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Supabase (${collection}): ${error.message}`);
    return (data?.data as Collections[K]) ?? null;
  }

  async put<K extends CollectionName>(collection: K, doc: Collections[K]) {
    const { error } = await this.client
      .from("documents")
      .upsert({ collection, id: doc.id, data: doc, updated_at: new Date().toISOString() });
    if (error) throw new Error(`Supabase (${collection}): ${error.message}`);
  }

  async remove<K extends CollectionName>(collection: K, id: string) {
    const { error } = await this.client
      .from("documents")
      .delete()
      .eq("collection", collection)
      .eq("id", id);
    if (error) throw new Error(`Supabase (${collection}): ${error.message}`);
  }

  async getSettings() {
    const { data, error } = await this.client
      .from("documents")
      .select("data")
      .eq("collection", "settings")
      .eq("id", "site")
      .maybeSingle();
    if (error) throw new Error(`Supabase (settings): ${error.message}`);
    return (data?.data as Partial<Settings>) ?? null;
  }

  async saveSettings(settings: Settings) {
    const { error } = await this.client.from("documents").upsert({
      collection: "settings",
      id: "site",
      data: settings,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`Supabase (settings): ${error.message}`);
  }

  async increment(key: string, by = 1) {
    const { error } = await this.client.rpc("increment_counter", { counter_key: key, amount: by });
    if (error) throw new Error(`Supabase (counters): ${error.message}`);
  }

  async counters(prefix: string) {
    const { data, error } = await this.client
      .from("counters")
      .select("key,value")
      .like("key", `${prefix.replace(/[%_]/g, "\\$&")}%`);
    if (error) throw new Error(`Supabase (counters): ${error.message}`);
    return Object.fromEntries((data ?? []).map((r) => [r.key as string, Number(r.value)]));
  }

  async uploadFile(path: string, data: Buffer, mime: string) {
    const { error } = await this.client.storage
      .from(BUCKET)
      .upload(path, data, { contentType: mime, upsert: false });
    if (error) throw new Error(`Supabase Storage: ${error.message}`);
    return this.client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async deleteFile(path: string) {
    await this.client.storage.from(BUCKET).remove([path]);
  }
}
