import type { Config } from "@netlify/functions";

/**
 * Tarea programada: cada hora (minuto 7, UTC) lanza la detección de noticias y
 * las propuestas automáticas de imágenes. Nada se aprueba ni se publica solo.
 * Las programadas solo se ejecutan en el despliegue de producción.
 */
const run = async (req: Request) => {
  // La petición programada llega al dominio del propio sitio: sirve de respaldo si falta URL.
  const base = Netlify.env.get("URL") || new URL(req.url).origin;
  const secret = Netlify.env.get("CRON_SECRET") ?? "";
  // Se llama aunque falte la clave: el servidor rechaza la petición y deja el motivo en sus registros.
  try {
    const res = await fetch(`${base}/api/cron/ingest`, {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(28_000),
    });
    console.log(`[voltio-cron] /api/cron/ingest → HTTP ${res.status} ${(await res.text()).slice(0, 500)}`);
  } catch (e) {
    console.log(`[voltio-cron] Sin respuesta en 28 s (la tarea sigue en el servidor): ${(e as Error).message}`);
  }
};

export default run;

export const config: Config = {
  schedule: "7 * * * *",
};
