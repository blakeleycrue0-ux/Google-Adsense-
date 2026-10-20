import type { Metadata } from "next";
import { EmptyState, RecipeCard } from "@/components/recipes/RecipeCard";
import { search } from "@/lib/content";

export const metadata: Metadata = { title: "Buscar recetas", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: PageProps<"/buscar">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 100) ?? "";
  const results = q ? await search(q) : [];
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="headline mb-6 text-3xl">Buscar recetas</h1>
      <form action="/buscar" className="mb-10 flex gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Ej.: lentejas, bizcocho, salsa de tomate…" className="field" aria-label="Qué receta buscas" />
        <button className="btn btn-primary">Buscar</button>
      </form>
      {q &&
        (results.length ? (
          <div className="divide-y divide-line [&>*]:py-4 [&>*:first-child]:pt-0">
            <p className="text-sm text-muted">
              {results.length} {results.length === 1 ? "receta" : "recetas"} con «{q}»
            </p>
            {results.slice(0, 60).map((r) => (
              <RecipeCard key={r.id} recipe={r} variant="row" />
            ))}
          </div>
        ) : (
          <EmptyState>No hay recetas con «{q}». Prueba con un ingrediente.</EmptyState>
        ))}
    </div>
  );
}
