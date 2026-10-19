import type { Config } from "@netlify/functions";

/**
 * Tarea programada: cada hora (minuto 7, UTC) lanza la detección de noticias y
 * las propuestas automáticas de imágenes. Nada se aprueba ni se publica solo.
 * Las programadas solo se ejecutan en el despliegue de producción.
 */
const run = async () => {
  const base = Netlify.env.get("URL");
  const secret = Netlify.env.get("CRON_SECRET");
  if (!base || !secret) {
    console.log("[voltio-cron] Falta URL o CRON_SECRET; no se ejecuta.");
    return;
  }
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
