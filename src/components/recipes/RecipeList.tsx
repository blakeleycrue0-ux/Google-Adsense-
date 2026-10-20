import Link from "next/link";
import { Ad } from "@/components/ads/Ad";
import { CATEGORIES } from "@/lib/site";
import type { Recipe } from "@/lib/types";
import { EmptyState, RecipeGrid } from "./RecipeCard";

/** Listado de recetas (todas o una categoría) con los filtros de categoría. */
export function RecipeList({ title, intro, recipes, current, empty }: { title: string; intro?: string; recipes: Recipe[]; current?: string; empty: string }) {
  return (
    <>
      <header className="mb-5 border-b-[3px] border-ink pb-3">
        <h1 className="headline text-[2rem] sm:text-5xl">{title}</h1>
        {intro && <p className="mt-2 text-ink-2">{intro}</p>}
      </header>
      <nav aria-label="Categorías" className="mb-8">
        <ul className="flex flex-wrap gap-2 text-[13px] font-semibold">
          <li>
            <Chip href="/recetas" active={!current}>
              Todas
            </Chip>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <Chip href={`/recetas/${c.id}`} active={current === c.id}>
                {c.name}
              </Chip>
            </li>
          ))}
        </ul>
      </nav>
      {recipes.length ? (
        <>
          <RecipeGrid recipes={recipes.slice(0, 9)} />
          {recipes.length > 9 && (
            <>
              <Ad slot="home" className="my-10" />
              <div className="border-t border-line pt-5 sm:border-0 sm:pt-0">
                <RecipeGrid recipes={recipes.slice(9, 120)} />
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

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`block rounded-full border px-3.5 py-2 ${active ? "border-ink bg-ink text-white" : "border-line text-ink-2 hover:border-ink hover:text-ink"}`}
    >
      {children}
    </Link>
  );
}
