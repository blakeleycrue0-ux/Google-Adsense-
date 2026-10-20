import { createClient } from "@supabase/supabase-js";
import { runBlobOp } from "./blobs-ops";

/**
 * Guarda el resultado de un borrador de IA en el mismo almacenamiento que lee
 * la web (Supabase si está configurado; si no, Netlify Blobs). Lo usa la
 * función en segundo plano, fuera de Next.js: sin «server-only» ni alias «@/».
 */
export async function writeJob(job: { id: string; status: "done" | "error"; createdAt: string; draft?: unknown; error?: string }) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await client.from("documents").upsert({ collection: "jobs", id: job.id, data: job, updated_at: new Date().toISOString() });
    if (error) throw new Error(`Supabase (jobs): ${error.message}`);
    return;
  }
  await runBlobOp({ op: "setJSON", store: "data", key: `d/jobs/${encodeURIComponent(job.id)}`, value: job });
}
