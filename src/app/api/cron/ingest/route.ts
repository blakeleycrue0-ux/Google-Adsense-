import { NextResponse } from "next/server";
import { ingest } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Detección programada. Llamar con «Authorization: Bearer CRON_SECRET»
 * (p. ej. desde Vercel Cron o un cron del servidor cada 15 minutos).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const report = await ingest();
  return NextResponse.json(report);
}
