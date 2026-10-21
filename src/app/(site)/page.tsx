import type { Metadata } from "next";
import Link from "next/link";
import { Ad } from "@/components/ads/Ad";
import { EmptyState, Meta, RecipeGrid, SectionTitle } from "@/components/recipes/RecipeCard";
import { PhotoImage } from "@/components/recipes/PhotoFigure";
import { SearchIcon } from "@/components/site/Header";
import { getPublished } from "@/lib/content";
import { recipePath } from "@/lib/recipes";
import { websiteLd } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { CATEGORIES, categoryName } from "@/lib/site";
import type { Recipe } from "@/lib/types";

export const revalidate = 60;

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [s, all] = await Promise.all([getSettings(), getPublished()]);
  const featured = all.slice(0, 8).find((r) => r.photo);
  const latest = all.filter((r) => r !== featured).slice(0, 8);
  const collage = all.filter((r) => r.photo).slice(0, 3);
  const byCategory = CATEGORIES.map((c) => ({
    ...c,
    items: all.filter((r) => r.category === c.id && r !== featured).slice(0, 4),
  })).filter((g) => g.items.length >= 2);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd(s)) }} />

      <section className="bg-celeste relative grid items-center gap-10 overflow-hidden rounded-3xl px-6 py-12 text-white sm:px-12 sm:py-16 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="text-sm font-medium text-white/85">{all.length ? `${all.length} recetas caseras, paso a paso` : s.siteName}</p>
          <h1 className="headline mt-2 max-w-2xl text-[2.25rem] sm:text-6xl">{s.tagline}</h1>
          <form
            action="/buscar"
            role="search"
            className="mt-7 flex max-w-lg items-center gap-2 rounded-full bg-white p-1.5 pl-4 shadow-[0_10px_30px_-10px_rgb(0_0_0/0.35)]"
          >
            <SearchIcon className="size-5 shrink-0 text-muted" />
            <input
              name="q"
              placeholder="Brownies, paella, lentejas…"
              aria-label="Buscar recetas"
              className="h-10 min-w-0 flex-1 bg-transparent text-ink outline-none"
            />
            <button className="h-10 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-black">Buscar</button>
          </form>
        </div>
        {collage.length === 3 && (
          <div className="hidden grid-cols-2 gap-3 lg:grid" aria-hidden>
            {collage.map((r, i) => (
              <PhotoImage
                key={r.id}
                photo={r.photo!}
                sizes="210px"
                aspect={i === 0 ? "row-span-2 h-full" : "aspect-square"}
                className="rounded-2xl shadow-[0_10px_30px_-12px_rgb(0_0_0/0.45)]"
              />
            ))}
          </div>
        )}
      </section>

      {!all.length ? (
        <div className="mt-10">
          <EmptyState>Pronto habrá recetas aquí.</EmptyState>
        </div>
      ) : (
        <>
          {featured && <Featured recipe={featured} />}

          {latest.length > 0 && (
            <section className="mt-14">
              <SectionTitle href="/recetas">Últimas recetas</SectionTitle>
              <RecipeGrid recipes={latest} />
            </section>
          )}

          <Ad slot="home" className="my-12" />

          {byCategory.map((g) => (
            <section key={g.id} className="mt-14">
              <SectionTitle href={`/recetas/${g.id}`}>{g.name}</SectionTitle>
              <RecipeGrid recipes={g.items} />
            </section>
          ))}
        </>
      )}
    </>
  );
}

/** Receta destacada: foto grande y texto al lado (debajo en el móvil). */
function Featured({ recipe }: { recipe: Recipe }) {
  return (
    <section className="mt-10 sm:mt-14">
      <Link href={recipePath(recipe)} className="group grid items-center gap-5 rounded-3xl bg-surface p-3 sm:p-4 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
        {recipe.photo && (
          <PhotoImage
            photo={recipe.photo}
            sizes="(min-width: 1024px) 620px, 100vw"
            priority
            className="rounded-2xl"
            imgClassName="transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        <div className="px-2 pb-3 lg:px-0 lg:pb-0 lg:pr-6">
          <p className="text-[13px] font-semibold text-sky-ink">Receta destacada · {categoryName(recipe.category)}</p>
          <h2 className="headline mt-2 text-[1.75rem] sm:text-4xl">{recipe.title}</h2>
          <p className="mt-3 line-clamp-3 leading-relaxed text-ink-2">{recipe.summary}</p>
          <Meta recipe={recipe} className="mt-4" />
          <span className="btn btn-primary mt-5">Ver la receta</span>
        </div>
      </Link>
    </section>
  );
}
