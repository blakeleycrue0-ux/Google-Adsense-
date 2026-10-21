import type { Metadata } from "next";
import { EmptyState, RecipeGrid } from "@/components/recipes/RecipeCard";
import { search } from "@/lib/content";

export const metadata: Metadata = { title: "Buscar recetas", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: PageProps<"/buscar">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 100) ?? "";
  const results = q ? await search(q) : [];
  return (
    <div>
      <h1 className="headline mb-6 text-[2rem] sm:text-5xl">Buscar recetas</h1>
      <form action="/buscar" className="mb-10 flex max-w-2xl gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Ej.: lentejas, bizcocho, salsa de tomate…" className="field" aria-label="Qué receta buscas" />
        <button className="btn btn-primary">Buscar</button>
      </form>
      {q &&
        (results.length ? (
          <>
            <p className="mb-5 text-sm text-muted">
              {results.length} {results.length === 1 ? "receta" : "recetas"} con «{q}»
            </p>
            <RecipeGrid recipes={results.slice(0, 60)} />
          </>
        ) : (
          <EmptyState>No hay recetas con «{q}». Prueba con un ingrediente.</EmptyState>
        ))}
    </div>
  );
}
