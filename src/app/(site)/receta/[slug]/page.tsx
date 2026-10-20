import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Ad } from "@/components/ads/Ad";
import { PhotoFigure } from "@/components/recipes/PhotoFigure";
import { Kicker, RecipeGrid, SectionTitle } from "@/components/recipes/RecipeCard";
import { IngredientList, ShareButtons } from "@/components/recipes/RecipeTools";
import { getBySlug, getRelated } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { formatMinutes, groupIngredients, recipePath, totalMinutes } from "@/lib/recipes";
import { breadcrumbLd, recipeLd } from "@/lib/seo";
import { absoluteUrl, getSettings } from "@/lib/settings";
import { categoryName, difficultyName } from "@/lib/site";

export const revalidate = 60;

// Ninguna receta se genera al compilar: cada una se crea en la primera visita y queda en caché.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/receta/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = await getBySlug(slug);
  if (!r) return {};
  const s = await getSettings();
  return {
    title: `${r.title}: receta paso a paso`,
    description: r.summary,
    alternates: { canonical: recipePath(r) },
    openGraph: {
      type: "article",
      title: r.title,
      description: r.summary,
      url: absoluteUrl(s, recipePath(r)),
      publishedTime: r.publishedAt,
      images: r.photo ? [{ url: absoluteUrl(s, r.photo.url), width: r.photo.width, height: r.photo.height, alt: r.photo.alt }] : undefined,
    },
  };
}

export default async function RecipePage({ params }: PageProps<"/receta/[slug]">) {
  const { slug } = await params;
  const r = await getBySlug(slug);
  if (!r) notFound();
  const [s, related] = await Promise.all([getSettings(), getRelated(r)]);
  const total = totalMinutes(r);
  const facts = [
    r.prepMinutes > 0 && { label: "Preparación", value: formatMinutes(r.prepMinutes) },
    r.cookMinutes > 0 && { label: "Cocción", value: formatMinutes(r.cookMinutes) },
    total > 0 && { label: "Total", value: formatMinutes(total) },
    r.servings && { label: "Raciones", value: r.servings },
    { label: "Dificultad", value: difficultyName(r.difficulty) },
  ].filter(Boolean) as { label: string; value: string }[];
  const ld = [
    recipeLd(s, r),
    breadcrumbLd(s, [
      { name: "Recetas", path: "/recetas" },
      { name: categoryName(r.category), path: `/recetas/${r.category}` },
      { name: r.title, path: recipePath(r) },
    ]),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <article className="mx-auto max-w-[760px]">
        <header className="space-y-3 sm:space-y-4">
          <Kicker recipe={r} link />
          <h1 className="headline text-[2rem] sm:text-5xl">{r.title}</h1>
          <p className="text-[1.1rem] leading-snug text-ink-2 sm:text-xl">{r.summary}</p>
          <p className="text-[13px] text-muted">
            {r.authorName && <span className="font-semibold text-ink">Por {r.authorName} · </span>}
            <time dateTime={r.publishedAt}>{formatDate(r.publishedAt!)}</time>
          </p>
          <ShareButtons title={r.title} />
        </header>

        {r.photo && (
          <div className="mt-5 sm:mt-6">
            <PhotoFigure photo={r.photo} priority />
          </div>
        )}

        <dl className="mt-6 grid grid-cols-3 border-y border-ink sm:grid-cols-5">
          {facts.map((f) => (
            <div key={f.label} className="px-1 py-3 text-center">
              <dt className="kicker text-muted">{f.label}</dt>
              <dd className="mt-1 font-semibold">{f.value}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-8" aria-labelledby="ingredientes">
          <h2 id="ingredientes" className="headline mb-4 text-2xl">
            Ingredientes
          </h2>
          <IngredientList groups={groupIngredients(r.ingredients)} />
        </section>

        <Ad slot="article" className="my-8 print:hidden" />

        <section className="mt-8" aria-labelledby="elaboracion">
          <h2 id="elaboracion" className="headline mb-4 text-2xl">
            Elaboración
          </h2>
          <ol className="space-y-5">
            {r.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white" aria-hidden>
                  {i + 1}
                </span>
                <p className="font-serif text-[1.125rem] leading-relaxed text-[#222]">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {r.tips.trim() && (
          <section className="mt-10 border-l-[3px] border-ink bg-surface p-5" aria-labelledby="consejos">
            <h2 id="consejos" className="kicker mb-2 text-ink">
              Consejos
            </h2>
            <div className="prose-news text-base" dangerouslySetInnerHTML={{ __html: renderMarkdown(r.tips) }} />
          </section>
        )}

        {r.tags.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-2 text-[13px] print:hidden">
            {r.tags.map((t) => (
              <li key={t}>
                <Link href={`/buscar?q=${encodeURIComponent(t)}`} className="block rounded-full border border-line px-3 py-1.5 text-ink-2 hover:border-ink">
                  #{t}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </article>

      {related.length > 0 && (
        <section className="mt-14 print:hidden">
          <SectionTitle href={`/recetas/${r.category}`}>Más recetas</SectionTitle>
          <RecipeGrid recipes={related} cols={4} />
        </section>
      )}
    </>
  );
}
