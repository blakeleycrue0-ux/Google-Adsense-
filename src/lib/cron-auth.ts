import "server-only";

/**
 * Comprueba «Authorization: Bearer CRON_SECRET». Si falla, deja el motivo en
 * los registros del servidor (nunca el valor de la clave).
 */
export function cronAuthorized(req: Request, route: string): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn(`[voltio-cron-auth] ${route}: CRON_SECRET no está configurado en el servidor.`);
    return false;
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    console.warn(`[voltio-cron-auth] ${route}: clave ausente o incorrecta.`);
    return false;
  }
  return true;
}
