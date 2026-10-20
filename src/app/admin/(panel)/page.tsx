import Link from "next/link";
import { listRecipes } from "@/lib/content";
import { formatSmart, normalizeText } from "@/lib/format";
import { getSettings, validAdsenseClient } from "@/lib/settings";
import { categoryName } from "@/lib/site";

const GOAL = 20;

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const filter = sp.ver === "publicadas" || sp.ver === "privadas" ? sp.ver : "todas";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const [s, all] = await Promise.all([getSettings(), listRecipes()]);
  const recipes = all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const published = recipes.filter((r) => r.status === "published");
  const shown = recipes
    .filter((r) => (filter === "publicadas" ? r.status === "published" : filter === "privadas" ? r.status === "private" : true))
    .filter((r) => !q || normalizeText(`${r.title} ${r.ingredients.join(" ")} ${r.tags.join(" ")}`).includes(normalizeText(q)));

  const checklist = [
    { ok: published.length >= GOAL, label: `Al menos ${GOAL} recetas publicadas (llevas ${published.length})` },
    { ok: published.length > 0 && published.every((r) => r.photo), label: "Todas las recetas publicadas con foto" },
    { ok: Boolean(s.about.trim()), label: "Texto «Sobre mí» escrito" },
    { ok: Boolean(s.ownerName && s.ownerNif && s.ownerAddress), label: "Datos del titular completos (aviso legal)" },
    { ok: Boolean(s.contactEmail), label: "Correo de contacto" },
    { ok: !s.siteUrl.includes("localhost") && !s.siteUrl.includes("netlify.app"), label: "Dominio propio (.es o .com)" },
    { ok: validAdsenseClient(s.adsenseClient), label: "ID de editor de AdSense (ca-pub-…)" },
  ];

  const tab = (id: string, label: string) => (
    <Link
      href={id === "todas" ? "/admin" : `/admin?ver=${id}`}
      className={`rounded-full border px-3 py-1.5 text-sm ${filter === id ? "border-ink bg-ink text-white" : "border-line bg-paper"}`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-8">
      {sp.borrada && <p className="rounded-md bg-paper p-3 text-sm">Receta eliminada.</p>}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Mis recetas</h1>
          <p className="text-sm text-muted">
            {published.length} publicadas · {recipes.length - published.length} privadas
          </p>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {tab("todas", "Todas")}
          {tab("publicadas", "Publicadas")}
          {tab("privadas", "Privadas")}
          <form action="/admin" className="ml-auto flex w-full gap-2 sm:w-auto">
            {filter !== "todas" && <input type="hidden" name="ver" value={filter} />}
            <input name="q" defaultValue={q} placeholder="Buscar receta o ingrediente" className="field py-1.5 text-sm" />
          </form>
        </div>
        {shown.length ? (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper">
            {shown.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/receta/${r.id}`} className="flex items-center gap-4 p-3 hover:bg-surface">
                  <div className="size-14 shrink-0 overflow-hidden rounded bg-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {r.photo && <img src={r.photo.url} alt="" className="size-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.title || "(sin nombre)"}</p>
                    <p className="text-xs text-muted">
                      {categoryName(r.category)} · {formatSmart(r.updatedAt)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${r.status === "published" ? "bg-[#e7f6ec] text-ok" : "bg-surface text-muted"}`}
                  >
                    {r.status === "published" ? "Publicada" : "Privada"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : recipes.length ? (
          <p className="rounded-lg border border-dashed border-line bg-paper p-8 text-center text-ink-2">Ninguna receta coincide.</p>
        ) : (
          <div className="rounded-lg border border-dashed border-line bg-paper p-10 text-center">
            <p className="text-ink-2">Aún no has guardado ninguna receta.</p>
            <Link href="/admin/receta/nueva" className="btn btn-primary mt-4">
              Guardar la primera
            </Link>
          </div>
        )}
      </section>

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
          <p className="mt-4 text-sm text-warn">El asistente de IA está desactivado: falta la variable ANTHROPIC_API_KEY en Netlify (opcional).</p>
        )}
      </section>
    </div>
  );
}
