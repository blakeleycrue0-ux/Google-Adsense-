import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { db } from "@/lib/db";
import { providerInfo, searchProvider } from "@/lib/images/providers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Diagnóstico del backend (protegido con CRON_SECRET): almacenamiento y
 * conexión real con cada proveedor de imágenes. Escribe el resumen en los
 * registros del servidor con el prefijo [voltio-diagnostico].
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req, "diagnostico")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const storage: { kind: string; ok: boolean; error?: string } = { kind: db().kind, ok: false };
  try {
    const before = (await db().counters("diag:"))["diag:check"] ?? 0;
    await db().increment("diag:check");
    const after = (await db().counters("diag:"))["diag:check"] ?? 0;
    storage.ok = after === before + 1;
  } catch (e) {
    storage.error = (e as Error).message;
  }
  const providers = await Promise.all(
    providerInfo()
      .filter((p) => p.configured)
      .map(async (p) => {
        const started = Date.now();
        try {
          const results = await searchProvider(p.id, "Samsung Galaxy smartphone", { perPage: 5, kind: "phone" });
          const usable = results.filter((r) => r.usable).length;
          return { provider: p.id, ok: true, results: results.length, usable, ms: Date.now() - started, sample: results[0] ? { title: results[0].title, license: results[0].licenseName } : null };
        } catch (e) {
          return { provider: p.id, ok: false, error: (e as Error).message, ms: Date.now() - started };
        }
      }),
  );
  const report = { at: new Date().toISOString(), storage, providers };
  console.log(`[voltio-diagnostico] ${JSON.stringify(report)}`);
  return NextResponse.json(report);
}
