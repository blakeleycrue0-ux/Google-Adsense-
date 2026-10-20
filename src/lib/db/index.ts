import "server-only";
import type { DataAdapter } from "./adapter";
import { BlobsAdapter } from "./blobs-adapter";
import { FileAdapter } from "./file-adapter";
import { SupabaseAdapter } from "./supabase-adapter";

let adapter: DataAdapter | undefined;

export function db(): DataAdapter {
  if (adapter) return adapter;
  // Prioridad: Supabase (si está configurado) → Netlify Blobs (en Netlify) → ficheros locales.
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) return (adapter = new SupabaseAdapter(url, key));
  // Durante `next build` Blobs no está disponible: se prerenderiza vacío y las
  // páginas se regeneran (ISR) con los datos reales en cuanto se despliegan.
  const building = process.env.NEXT_PHASE === "phase-production-build";
  const onNetlify = !building && (process.env.STORAGE_DRIVER === "netlify-blobs" || Boolean(process.env.NETLIFY_BLOBS_CONTEXT));
  adapter = onNetlify ? new BlobsAdapter() : new FileAdapter();
  return adapter;
}

export function newId(prefix = ""): string {
  return prefix + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}
