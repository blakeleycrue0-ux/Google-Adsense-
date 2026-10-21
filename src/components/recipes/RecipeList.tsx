import { Ad } from "@/components/ads/Ad";
import type { Recipe } from "@/lib/types";
import { EmptyState, RecipeGrid } from "./RecipeCard";

/** Listado de recetas (todas o una categoría). Las categorías están en la cabecera. */
export function RecipeList({ title, intro, recipes, empty }: { title: string; intro?: string; recipes: Recipe[]; empty: string }) {
  return (
    <>
      <header className="mb-8 rounded-3xl bg-surface px-6 py-8 sm:px-10 sm:py-12">
        <p className="text-[13px] font-medium text-muted">
          {recipes.length} {recipes.length === 1 ? "receta" : "recetas"}
        </p>
        <h1 className="headline mt-1 text-[2rem] sm:text-5xl">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">{intro}</p>}
      </header>
      {recipes.length ? (
        <>
          <RecipeGrid recipes={recipes.slice(0, 8)} priority />
          {recipes.length > 8 && (
            <>
              <Ad slot="home" className="my-10" />
              <div className="mt-7 lg:mt-10">
                <RecipeGrid recipes={recipes.slice(8, 120)} />
              </div>
            </>
          )}
        </>
      ) : (
        <EmptyState>{empty}</EmptyState>
      )}
    </>
  );
}
