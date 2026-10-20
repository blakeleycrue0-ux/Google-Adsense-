import Link from "next/link";
import { formatMinutes, recipePath, totalMinutes } from "@/lib/recipes";
import { categoryName, difficultyName } from "@/lib/site";
import type { Recipe } from "@/lib/types";
import { PhotoImage } from "./PhotoFigure";

/** Antetítulo en una línea: «POSTRES · 45 MIN · FÁCIL». */
export function Kicker({ recipe, link }: { recipe: Recipe; link?: boolean }) {
  const time = formatMinutes(totalMinutes(recipe));
  const cat = link ? (
    <Link href={`/recetas/${recipe.category}`} className="text-ink hover:underline">
      {categoryName(recipe.category)}
    </Link>
  ) : (
    <span className="text-ink">{categoryName(recipe.category)}</span>
  );
  return (
    <p className="kicker truncate text-muted">
      {cat}
      {time && <> · {time}</>}
      {recipe.difficulty && <> · {difficultyName(recipe.difficulty)}</>}
    </p>
  );
}

/** Receta destacada: foto grande y título en grande. */
export function LeadRecipe({ recipe }: { recipe: Recipe }) {
  return (
    <article className="group">
      <Link href={recipePath(recipe)} className="block">
        {recipe.photo && (
          <PhotoImage photo={recipe.photo} sizes="(min-width: 1024px) 720px, 100vw" priority className="-mx-4 mb-4 sm:mx-0 sm:rounded-sm" />
        )}
        <div className="space-y-2.5">
          <Kicker recipe={recipe} />
          <h2 className="headline text-[1.85rem] group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4 sm:text-[2.6rem]">
            {recipe.title}
          </h2>
          <p className="text-[1.05rem] leading-relaxed text-ink-2 sm:text-lg">{recipe.summary}</p>
        </div>
      </Link>
    </article>
  );
}

/**
 * Receta en listados. En el móvil: texto a la izquierda y miniatura a la
 * derecha. Desde tableta, en «card», foto arriba y texto debajo.
 */
export function RecipeCard({ recipe, variant = "card" }: { recipe: Recipe; variant?: "card" | "row" }) {
  const card = variant === "card";
  return (
    <article className="group">
      <Link href={recipePath(recipe)} className={`flex gap-4 ${card ? "sm:flex-col sm:gap-3" : ""}`}>
        {recipe.photo && (
          <PhotoImage
            photo={recipe.photo}
            sizes={card ? "(min-width: 1024px) 360px, (min-width: 640px) 50vw, 112px" : "128px"}
            aspect={card ? "aspect-square sm:aspect-[4/3]" : "aspect-square sm:aspect-[4/3]"}
            className={`order-2 w-24 shrink-0 rounded-sm sm:w-32 ${card ? "sm:order-1 sm:w-full" : ""}`}
          />
        )}
        <div className={`order-1 min-w-0 flex-1 space-y-1.5 ${card ? "sm:order-2" : ""}`}>
          <Kicker recipe={recipe} />
          <h3 className={`headline text-[1.08rem] group-hover:underline group-hover:underline-offset-2 ${card ? "sm:text-xl" : "sm:text-lg"}`}>
            {recipe.title}
          </h3>
          <p className={`text-sm leading-relaxed text-ink-2 ${card ? "line-clamp-2 sm:line-clamp-3" : "line-clamp-2"}`}>{recipe.summary}</p>
        </div>
      </Link>
    </article>
  );
}

/** Rejilla: en el móvil lista con separadores; desde tableta, 2-3 columnas. */
export function RecipeGrid({ recipes, cols = 3 }: { recipes: Recipe[]; cols?: 3 | 4 }) {
  return (
    <div
      className={`grid divide-y divide-line sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 sm:divide-y-0 ${cols === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"} [&>*]:py-4 sm:[&>*]:py-0 [&>*:first-child]:pt-0`}
    >
      {recipes.map((r) => (
        <RecipeCard key={r.id} recipe={r} />
      ))}
    </div>
  );
}

export function SectionTitle({ children, href }: { children: React.ReactNode; href?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between border-t-[3px] border-ink pt-2.5">
      <h2 className="text-lg font-extrabold uppercase tracking-wide">{children}</h2>
      {href && (
        <Link href={href} className="text-sm text-muted hover:text-ink">
          Ver todas →
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="border-y border-line px-6 py-14 text-center text-muted">{children}</p>;
}
