import type { DeploySucceededEvent } from "@netlify/functions";

/**
 * Tras cada despliegue correcto comprueba, desde el propio backend de Netlify,
 * que las búsquedas de imágenes y el almacenamiento funcionan, y lanza una
 * primera tanda de propuestas. El resultado queda en los registros de funciones.
 */
const handlers = {
  async deploySucceeded(event: DeploySucceededEvent) {
    const base = Netlify.env.get("URL");
    const secret = Netlify.env.get("CRON_SECRET");
    if (!base || !secret) {
      console.log("[voltio-deploy-check] Falta URL o CRON_SECRET.");
      return;
    }
    const headers = { Authorization: `Bearer ${secret}` };
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
