import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { ingest } from "@/lib/ingest";
import { autoPropose } from "@/lib/images/search";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Se responde antes del límite de 30 s de Netlify aunque el trabajo no haya terminado. */
const RESPONSE_DEADLINE_MS = 20_000;

/**
 * Detección programada. Llamar con «Authorization: Bearer CRON_SECRET»
 * (p. ej. desde Vercel Cron o un cron del servidor cada 15 minutos).
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req, "ingest")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const started = Date.now();
  const work = (async () => {
    const report = await ingest();
    const rssMs = Date.now() - started;
    console.warn(`[voltio-ingest] rss: ${report.added} nuevas en ${rssMs}ms`);
    // Propone imágenes para lo detectado y para contenidos pendientes. Nunca aprueba ni publica.
    const images = await autoPropose(10, { budgetMs: 24_000 - rssMs });
    console.warn(
      `[voltio-ingest] imágenes: ${images.proposed} propuestas de ${images.searched} (quedan ${images.pending}) · total ${Date.now() - started}ms`,
    );
    return { ...report, images };
  })();

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => (timer = setTimeout(() => resolve(null), RESPONSE_DEADLINE_MS)));
  const result = await Promise.race([work, timeout]);
  clearTimeout(timer);
  if (!result) {
    // Lo ya buscado queda guardado; lo pendiente se retoma en la siguiente ejecución.
    console.warn(`[voltio-ingest] sin terminar a los ${RESPONSE_DEADLINE_MS / 1000} s; continúa en la próxima ejecución`);
    work.catch((e) => console.warn(`[voltio-ingest] error: ${(e as Error).message}`));
    return NextResponse.json({ partial: true }, { status: 202 });
  }
  return NextResponse.json(result);
}
