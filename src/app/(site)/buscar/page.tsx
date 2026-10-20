import type { Metadata } from "next";
import { ArticleCard, EmptyState } from "@/components/news/ArticleCard";
import { search } from "@/lib/content";

export const metadata: Metadata = { title: "Buscar", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: PageProps<"/buscar">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 100) ?? "";
  const results = q ? await search(q) : [];
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="headline mb-6 text-3xl">Buscar noticias</h1>
      <form action="/buscar" className="mb-10 flex gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Ej.: aeropuerto, Sóller, incendio…" className="field" aria-label="Qué quieres buscar" />
        <button className="btn btn-primary">Buscar</button>
      </form>
      {q &&
        (results.length ? (
          <div className="space-y-6">
            <p className="text-sm text-muted">
              {results.length} {results.length === 1 ? "resultado" : "resultados"} para «{q}»
            </p>
            {results.slice(0, 50).map((a) => (
              <ArticleCard key={a.id} article={a} variant="row" />
            ))}
          </div>
        ) : (
          <EmptyState>No hay noticias que contengan «{q}».</EmptyState>
        ))}
    </div>
  );
}
