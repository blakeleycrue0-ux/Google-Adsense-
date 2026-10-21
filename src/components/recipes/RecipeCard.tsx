import Link from "next/link";
import { formatMinutes, recipePath, totalMinutes } from "@/lib/recipes";
import { categoryName, difficultyName } from "@/lib/site";
import type { Recipe } from "@/lib/types";
import { PhotoImage } from "./PhotoFigure";

export const ClockIcon = ({ className = "size-3.5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

/** «45 min · Fácil», con el icono del reloj. */
export function Meta({ recipe, className = "" }: { recipe: Recipe; className?: string }) {
  const time = formatMinutes(totalMinutes(recipe));
  return (
    <p className={`flex items-center gap-1.5 text-[13px] text-muted ${className}`}>
      {time && (
        <>
          <ClockIcon />
          <span>{time}</span>
          <span aria-hidden>·</span>
        </>
      )}
      <span>{difficultyName(recipe.difficulty)}</span>
    </p>
  );
}

/** Tarjeta: foto con esquinas redondeadas, categoría encima y título debajo. */
export function RecipeCard({ recipe, priority }: { recipe: Recipe; priority?: boolean }) {
  return (
    <article className="group">
      <Link href={recipePath(recipe)} className="block">
        <div className="relative">
          {recipe.photo ? (
            <PhotoImage
              photo={recipe.photo}
              sizes="(min-width: 1024px) 280px, 50vw"
              priority={priority}
              aspect="aspect-[4/5]"
              className="rounded-2xl"
              imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="aspect-[4/5] rounded-2xl bg-surface" />
          )}
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink">
            {categoryName(recipe.category)}
          </span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight group-hover:text-sky-ink sm:text-base">{recipe.title}</h3>
        <Meta recipe={recipe} className="mt-1" />
      </Link>
    </article>
  );
}

/** Rejilla: dos columnas en el móvil, cuatro en escritorio. */
export function RecipeGrid({ recipes, priority }: { recipes: Recipe[]; priority?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10">
      {recipes.map((r, i) => (
        <RecipeCard key={r.id} recipe={r} priority={priority && i < 4} />
      ))}
    </div>
  );
}

export function SectionTitle({ children, href }: { children: React.ReactNode; href?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="headline text-2xl sm:text-[1.75rem]">{children}</h2>
      {href && (
        <Link href={href} className="shrink-0 text-sm font-medium text-sky-ink hover:underline">
          Ver todas →
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl bg-surface px-6 py-14 text-center text-muted">{children}</p>;
}
