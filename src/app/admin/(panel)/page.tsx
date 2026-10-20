import Link from "next/link";
import { db } from "@/lib/db";
import { formatSmart } from "@/lib/format";
import { getSettings, validAdsenseClient } from "@/lib/settings";
import { islandName, sectionName } from "@/lib/site";

const GOAL = 30;

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const { borrada } = await searchParams;
  const [s, all] = await Promise.all([getSettings(), db().list("articles")]);
  const articles = all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const published = articles.filter((a) => a.status === "published");
  const withOwnPhoto = published.filter((a) => a.photo).length;

  const checklist = [
    { ok: published.length >= GOAL, label: `Al menos ${GOAL} noticias propias publicadas (llevas ${published.length})` },
    { ok: published.length > 0 && withOwnPhoto / published.length >= 0.8, label: "La mayoría de noticias con foto y crédito" },
    { ok: Boolean(s.ownerName && s.ownerNif && s.ownerAddress), label: "Datos del titular completos (aviso legal)" },
    { ok: Boolean(s.contactEmail), label: "Correo de contacto" },
    { ok: !s.siteUrl.includes("localhost") && !s.siteUrl.includes("netlify.app"), label: "Dominio propio configurado (recomendado)" },
    { ok: validAdsenseClient(s.adsenseClient), label: "ID de editor de AdSense (ca-pub-…)" },
  ];

  return (
    <div className="space-y-8">
      {borrada && <p className="rounded-md bg-paper p-3 text-sm">Noticia eliminada.</p>}

      <section className="rounded-lg border border-line bg-paper p-5">
        <h2 className="font-bold">Camino a AdSense</h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {checklist.map((c) => (
            <li key={c.label} className="flex gap-2">
              <span className={c.ok ? "text-ok" : "text-muted"} aria-hidden>
                {c.ok ? "✔" : "○"}
              </span>
              <span className={c.ok ? "" : "text-ink-2"}>{c.label}</span>
            </li>
          ))}
        </ul>
        {!process.env.ANTHROPIC_API_KEY && (
          <p className="mt-4 text-sm text-warn">El asistente de redacción con IA está desactivado: falta la variable ANTHROPIC_API_KEY en Netlify.</p>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Noticias</h1>
          <p className="text-sm text-muted">
            {published.length} publicadas · {articles.length - published.length} borradores
          </p>
        </div>
        {articles.length ? (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper">
            {articles.map((a) => (
              <li key={a.id}>
                <Link href={`/admin/noticia/${a.id}`} className="flex items-center gap-4 p-3 hover:bg-surface">
                  <div className="size-14 shrink-0 overflow-hidden rounded bg-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {a.photo && <img src={a.photo.url} alt="" className="size-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{a.title || "(sin titular)"}</p>
                    <p className="text-xs text-muted">
                      {islandName(a.island)} · {sectionName(a.section)} · {formatSmart(a.updatedAt)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${a.status === "published" ? "bg-[#e7f6ec] text-ok" : "bg-surface text-muted"}`}
                  >
                    {a.status === "published" ? (a.breaking ? "Publicada · Última hora" : "Publicada") : "Borrador"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-line bg-paper p-10 text-center">
            <p className="text-ink-2">Aún no has escrito ninguna noticia.</p>
            <Link href="/admin/noticia/nueva" className="btn btn-primary mt-4">
              Escribir la primera
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
