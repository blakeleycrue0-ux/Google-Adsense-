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
  // En Netlify también durante `next build`: el adaptador lee a través de la
  // función «store», así que las páginas se generan con las recetas reales
  // (antes la portada salía vacía hasta un minuto después de cada despliegue).
  // Si la función no responde, las lecturas fallan, las páginas se generan
  // vacías y se regeneran solas (ISR).
  const onNetlify = process.env.STORAGE_DRIVER === "netlify-blobs" || Boolean(process.env.NETLIFY_BLOBS_CONTEXT);
  adapter = onNetlify ? new BlobsAdapter() : new FileAdapter();
  return adapter;
}

export function newId(prefix = ""): string {
  return prefix + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}
