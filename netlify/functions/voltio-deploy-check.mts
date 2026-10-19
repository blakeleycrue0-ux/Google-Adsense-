import type { DeploySucceededEvent } from "@netlify/functions";

/**
 * Tras cada despliegue de producción comprueba, desde el propio backend de
 * Netlify, que las búsquedas de imágenes y el almacenamiento funcionan, y lanza
 * una primera tanda de propuestas. El resultado queda en los registros del
 * servidor ([voltio-diagnostico]). Las vistas previas están protegidas con
 * inicio de sesión de Netlify, así que en ellas no se comprueba nada.
 */
const handlers = {
  async deploySucceeded(event: DeploySucceededEvent) {
    if (event.deploy.context !== "production") return;
    const base = Netlify.env.get("URL") || event.deploy.sslUrl;
    const headers = { Authorization: `Bearer ${Netlify.env.get("CRON_SECRET") ?? ""}` };
    for (const path of ["/api/cron/diagnostico", "/api/cron/ingest"]) {
      try {
        const res = await fetch(`${base}${path}`, { headers, signal: AbortSignal.timeout(60_000) });
        console.log(`[voltio-deploy-check] deploy ${event.deploy.id} ${path} → HTTP ${res.status} ${(await res.text()).slice(0, 1500)}`);
      } catch (e) {
        console.log(`[voltio-deploy-check] ${path} sin respuesta: ${(e as Error).message}`);
      }
    }
  },
};

export default handlers;
