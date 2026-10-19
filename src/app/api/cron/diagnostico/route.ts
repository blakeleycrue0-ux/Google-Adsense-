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
  // Lectura real de una colección (con límite de 5 s).
  let reads = "";
  if (storage.kind === "netlify-blobs") {
    const probe = async (label: string, fn: () => Promise<unknown>) => {
      const t = Date.now();
      const out = await Promise.race([
        fn().then(() => `${Date.now() - t}ms`, (e: Error) => `error ${e.message.slice(0, 80)}`),
        new Promise<string>((r) => setTimeout(() => r("más de 5 s"), 5_000)),
      ]);
      return `${label}=${out}`;
    };
    reads = (
      await Promise.all([
        probe("list-fuentes", () => db().list("sources")),
      ])
    ).join(" ");
  }
  const report = { at: new Date().toISOString(), storage, providers, reads };
  // Una línea corta: en Netlify las líneas largas de las rutas no siempre llegan a los registros.
  const summary = providers.map((p) => (p.ok ? `${p.provider}=ok ${p.results} resultados (${p.usable} utilizables) ${p.ms}ms` : `${p.provider}=error ${p.error}`));
  console.warn(`[voltio-diagnostico] almacenamiento=${storage.kind}:${storage.ok ? "ok" : `error ${storage.error ?? ""}`} · ${summary.join(" · ")}${reads ? ` · lecturas: ${reads}` : ""}`);
  // 503 si algo falla, para que el estado sea visible en los registros de peticiones.
  const healthy = storage.ok && providers.every((p) => p.ok && (p.results ?? 0) > 0);
  return NextResponse.json(report, { status: healthy ? 200 : 503 });
}
