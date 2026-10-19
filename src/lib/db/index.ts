import "server-only";
import type { DataAdapter } from "./adapter";
import { FileAdapter } from "./file-adapter";
import { SupabaseAdapter } from "./supabase-adapter";

let adapter: DataAdapter | undefined;

export function db(): DataAdapter {
  if (adapter) return adapter;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  adapter = url && key ? new SupabaseAdapter(url, key) : new FileAdapter();
  return adapter;
}

export function newId(prefix = ""): string {
  return prefix + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}
