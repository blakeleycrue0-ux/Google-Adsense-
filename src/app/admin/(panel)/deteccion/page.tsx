import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { AdminPage, Empty, StatusPill } from "@/components/admin/ui";
import { aiEnabled } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatSmart } from "@/lib/format";
import { createDraft, runIngest, setDetectedStatus } from "./actions";

const TABS = [
  { id: "nuevas", label: "Por revisar" },
  { id: "duplicados", label: "Duplicados probables" },
  { id: "borradores", label: "Con borrador" },
  { id: "descartadas", label: "Descartadas" },
];

export default async function DetectionPage({ searchParams }: PageProps<"/admin/deteccion">) {
  await requireUser();
  const sp = await searchParams;
  const tab = typeof sp.vista === "string" ? sp.vista : "nuevas";
  const [items, cats, sources] = await Promise.all([db().list("detected"), db().list("categories"), db().list("sources")]);
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const byId = new Map(items.map((i) => [i.id, i]));
  const filtered = items
    .filter((i) =>
      tab === "duplicados" ? i.status === "new" && i.duplicateOf
      : tab === "borradores" ? i.status === "drafted"
      : tab === "descartadas" ? i.status === "discarded"
      : i.status === "new" && !i.duplicateOf,
    )
    .sort((a, b) => (b.publishedAt ?? b.detectedAt).localeCompare(a.publishedAt ?? a.detectedAt))
    .slice(0, 200);
  const activeSources = sources.filter((s) => s.active).length;
  const ai = aiEnabled();

  return (
    <AdminPage
      title="Detección de noticias"
      description="Novedades detectadas en tus fuentes RSS. Revisa, descarta duplicados y crea borradores: nada se publica automáticamente."
      actions={
        <ActionForm action={runIngest}>
          <SubmitButton>Buscar novedades ahora</SubmitButton>
        </ActionForm>
      }
    >
      {activeSources === 0 && (
        <p className="mb-6 rounded-sm border border-dashed border-line-strong bg-paper px-4 py-3 text-[13px] text-muted">
          No hay fuentes activas. Ve a <Link href="/admin/fuentes" className="underline">Fuentes</Link>, revisa las condiciones de uso de cada feed y actívalas.
        </p>
      )}
      <div className="mb-5 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/deteccion?vista=${t.id}`}
            aria-current={tab === t.id ? "page" : undefined}
            className="h-8 rounded-sm px-3 text-[13px] leading-8 text-ink-2 hover:bg-surface aria-[current=page]:bg-ink aria-[current=page]:text-paper"
          >
            {t.label}
          </Link>
        ))}
      </div>
      {filtered.length === 0 ? (
        <Empty title="Nada en esta vista">Pulsa «Buscar novedades ahora» o programa el cron para detectar noticias.</Empty>
      ) : (
        <ul className="divide-y divide-line rounded-md border border-line bg-paper">
          {filtered.map((it) => {
            const dup = it.duplicateOf?.startsWith("post:") ? null : it.duplicateOf ? byId.get(it.duplicateOf) : null;
            return (
              <li key={it.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
                    <span className="font-medium text-ink">{it.sourceName}</span>
                    <span>{formatSmart(it.publishedAt ?? it.detectedAt)}</span>
                    <span>· Categoría sugerida: {catName.get(it.suggestedCategoryId ?? "") ?? "—"}</span>
                    {it.matchedKeywords.length > 0 && <span className="font-mono text-[11px] text-faint">[{it.matchedKeywords.join(", ")}]</span>}
                    <StatusPill status={it.status} />
                  </p>
                  <a href={it.url} target="_blank" rel="noopener noreferrer" className="mt-1.5 block text-[15px] font-medium leading-snug hover:underline">
                    {it.title} ↗
                  </a>
                  {it.snippet && <p className="mt-1 line-clamp-2 text-[13px] text-muted">{it.snippet}</p>}
                  {it.duplicateOf && (
                    <p className="mt-1.5 text-[12px] text-warn">
                      Posible duplicado {it.similarity ? `(${Math.round(it.similarity * 100)} % de similitud)` : ""} de:{" "}
                      {it.duplicateOf.startsWith("post:") ? (
                        <Link className="underline" href={`/admin/articulos/${it.duplicateOf.slice(5)}`}>un artículo ya existente</Link>
                      ) : (
                        <span>«{dup?.title ?? "otro elemento"}» ({dup?.sourceName})</span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {it.status === "drafted" && it.draftPostId ? (
                    <Link href={`/admin/articulos/${it.draftPostId}`} className="btn-secondary btn-sm">Abrir borrador</Link>
                  ) : (
                    <>
                      <form action={createDraft}>
                        <input type="hidden" name="id" value={it.id} />
                        <button className="btn-primary btn-sm">Crear borrador</button>
                      </form>
                      {ai && (
                        <form action={createDraft}>
                          <input type="hidden" name="id" value={it.id} />
                          <input type="hidden" name="ai" value="1" />
                          <button className="btn-secondary btn-sm" title="Genera un esquema a partir del titular y el extracto. Requiere verificación.">Borrador con IA</button>
                        </form>
                      )}
                      <form action={setDetectedStatus}>
                        <input type="hidden" name="id" value={it.id} />
                        <input type="hidden" name="status" value={it.status === "discarded" ? "new" : "discarded"} />
                        <button className="btn-ghost btn-sm">{it.status === "discarded" ? "Recuperar" : "Descartar"}</button>
                      </form>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AdminPage>
  );
}
