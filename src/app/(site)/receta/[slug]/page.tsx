import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Ad } from "@/components/ads/Ad";
import { PhotoFigure } from "@/components/recipes/PhotoFigure";
import { RecipeGrid, SectionTitle } from "@/components/recipes/RecipeCard";
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
      <article>
        <header className="mx-auto max-w-3xl text-center">
          <Link href={`/recetas/${r.category}`} className="inline-block rounded-full bg-sky-soft px-3 py-1 text-[13px] font-semibold text-sky-ink hover:bg-sky hover:text-white">
            {categoryName(r.category)}
          </Link>
          <h1 className="headline mt-4 text-[2.1rem] sm:text-[3.25rem]">{r.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-[1.075rem] leading-relaxed text-ink-2 sm:text-lg">{r.summary}</p>
          <p className="mt-3 text-[13px] text-muted">
            {r.authorName && <span className="font-semibold text-ink">Por {r.authorName} · </span>}
            <time dateTime={r.publishedAt}>{formatDate(r.publishedAt!)}</time>
          </p>
          <div className="mt-5 flex justify-center">
            <ShareButtons title={r.title} />
          </div>
        </header>

        {r.photo && (
          <div className="mt-7 sm:mt-9">
            <PhotoFigure photo={r.photo} priority />
          </div>
        )}

        <dl className="mx-auto mt-6 grid max-w-4xl grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
          {facts.map((f) => (
            <div key={f.label} className="rounded-2xl bg-surface px-2 py-3.5 text-center">
              <dt className="text-xs text-muted">{f.label}</dt>
              <dd className="mt-0.5 text-[15px] font-semibold">{f.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mx-auto mt-10 grid max-w-5xl gap-10 lg:grid-cols-[340px_1fr] lg:gap-14">
          <section aria-labelledby="ingredientes" className="self-start rounded-3xl bg-surface p-5 sm:p-6 lg:sticky lg:top-32">
            <h2 id="ingredientes" className="headline mb-3 text-2xl">
              Ingredientes
            </h2>
            {r.servings && <p className="-mt-1 mb-3 text-sm text-muted">Para {r.servings}</p>}
            <IngredientList groups={groupIngredients(r.ingredients)} />
          </section>

          <div className="min-w-0">
            <section aria-labelledby="elaboracion">
              <h2 id="elaboracion" className="headline mb-5 text-2xl">
                Elaboración
              </h2>
              <ol className="space-y-6">
                {r.steps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white" aria-hidden>
                      {i + 1}
                    </span>
                    <p className="pt-0.5 text-[1.0625rem] leading-relaxed text-ink-2">{step}</p>
                  </li>
                ))}
              </ol>
            </section>

            <Ad slot="article" className="my-10 print:hidden" />

            {r.tips.trim() && (
              <section className="mt-10 rounded-3xl bg-sky-soft p-5 sm:p-6" aria-labelledby="consejos">
                <h2 id="consejos" className="mb-2 font-bold text-sky-ink">
                  💡 Consejos
                </h2>
                <div className="prose-news text-base" dangerouslySetInnerHTML={{ __html: renderMarkdown(r.tips) }} />
              </section>
            )}

            {r.tags.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-2 text-[13px] print:hidden">
                {r.tags.map((t) => (
                  <li key={t}>
                    <Link href={`/buscar?q=${encodeURIComponent(t)}`} className="block rounded-full bg-surface px-3 py-1.5 text-ink-2 hover:bg-ink hover:text-white">
                      #{t}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-16 border-t border-line pt-10 print:hidden">
          <SectionTitle href={`/recetas/${r.category}`}>También te puede gustar</SectionTitle>
          <RecipeGrid recipes={related} />
        </section>
      )}
    </>
  );
}
