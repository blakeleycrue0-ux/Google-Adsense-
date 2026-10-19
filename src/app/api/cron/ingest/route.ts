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
  // RSS e imágenes en paralelo: las imágenes de lo ya detectado no esperan a los feeds.
  // Las noticias nuevas de esta ejecución reciben imagen en la siguiente.
  const rss = ingest().then((report) => {
    console.warn(`[voltio-ingest] rss: ${report.added} nuevas en ${Date.now() - started}ms`);
    return report;
  });
  const imagesWork = autoPropose(10, { budgetMs: 18_000 }).then((images) => {
    console.warn(
      `[voltio-ingest] imágenes: ${images.published} publicadas, ${images.proposed} con propuesta, ${images.searched} buscadas (quedan ${images.pending}) en ${Date.now() - started}ms`,
    );
    return images;
  });
  const work = Promise.all([rss, imagesWork]).then(([report, images]) => ({ ...report, images }));

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
