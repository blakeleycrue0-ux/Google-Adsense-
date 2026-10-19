import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { ingest } from "@/lib/ingest";
import { autoPropose } from "@/lib/images/search";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Detección programada. Llamar con «Authorization: Bearer CRON_SECRET»
 * (p. ej. desde Vercel Cron o un cron del servidor cada 15 minutos).
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req, "ingest")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const started = Date.now();
  const report = await ingest();
  // Propone imágenes para lo detectado y para contenidos pendientes. Nunca aprueba ni publica.
  // Se ajusta al tiempo que queda antes del límite de 30 s de Netlify.
  const images = await autoPropose(10, { budgetMs: Math.max(0, 15_000 - (Date.now() - started)) });
  return NextResponse.json({ ...report, images });
}
