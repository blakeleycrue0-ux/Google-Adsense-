import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Ad } from "@/components/ads/Ad";
import { ArticleCard, Kicker, SectionTitle } from "@/components/news/ArticleCard";
import { PhotoFigure } from "@/components/news/PhotoFigure";
import { getBySlug, getRelated } from "@/lib/content";
import { formatSmart, readingMinutes } from "@/lib/format";
import { renderMarkdown, splitForAd } from "@/lib/markdown";
import { articleLd } from "@/lib/seo";
import { absoluteUrl, getSettings } from "@/lib/settings";

export const revalidate = 60;

// Ninguna noticia se genera al compilar: cada una se crea en la primera visita y queda en caché.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/noticia/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await getBySlug(slug);
  if (!a) return {};
  const s = await getSettings();
  return {
    title: a.title,
    description: a.summary,
    alternates: { canonical: `/noticia/${a.slug}` },
    openGraph: {
      type: "article",
      title: a.title,
      description: a.summary,
      url: absoluteUrl(s, `/noticia/${a.slug}`),
      publishedTime: a.publishedAt,
      modifiedTime: a.updatedAt,
      images: a.photo ? [{ url: absoluteUrl(s, a.photo.url), width: a.photo.width, height: a.photo.height, alt: a.photo.alt }] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: PageProps<"/noticia/[slug]">) {
  const { slug } = await params;
  const a = await getBySlug(slug);
  if (!a) notFound();
  const [s, related] = await Promise.all([getSettings(), getRelated(a)]);
  const [first, second] = splitForAd(renderMarkdown(a.body));
  const updated = a.updatedAt > a.publishedAt! && Date.parse(a.updatedAt) - Date.parse(a.publishedAt!) > 10 * 60_000;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd(s, a)) }} />
      <article className="mx-auto max-w-[760px]">
        <header className="space-y-4">
          <Kicker article={a} />
          <h1 className="headline text-3xl sm:text-[2.6rem]">{a.title}</h1>
          <p className="text-xl leading-snug text-ink-2">{a.summary}</p>
          <p className="flex flex-wrap gap-x-3 gap-y-1 border-y border-line py-3 text-sm text-muted">
            <span className="font-semibold text-ink">{a.authorName || "Redacción"}</span>
            <time dateTime={a.publishedAt}>{formatSmart(a.publishedAt!)}</time>
            {updated && <span>Actualizada: {formatSmart(a.updatedAt)}</span>}
            <span>{readingMinutes(a.body)} min de lectura</span>
          </p>
        </header>

        {a.photo && (
          <div className="mt-6">
            <PhotoFigure photo={a.photo} priority />
          </div>
        )}

        <div className="prose-news mt-8" dangerouslySetInnerHTML={{ __html: first }} />
        {second && (
          <>
            <Ad slot="article" className="my-8" />
            <div className="prose-news mt-6" dangerouslySetInnerHTML={{ __html: second }} />
          </>
        )}

        {a.sources.length > 0 && (
          <aside className="mt-10 rounded-md bg-surface p-5 text-sm">
            <p className="kicker mb-2 text-muted">Fuentes</p>
            <ul className="space-y-1">
              {a.sources.map((src) => (
                <li key={src.url}>
                  <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-sea underline underline-offset-2">
                    {src.name}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}

        <p className="mt-8 text-sm text-muted">
          ¿Has visto un error o tienes más información? <Link href="/contacto" className="text-sea underline underline-offset-2">Escríbenos</Link>.
        </p>
      </article>

      {related.length > 0 && (
        <section className="mx-auto mt-16 max-w-[1180px]">
          <SectionTitle>También te puede interesar</SectionTitle>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <ArticleCard key={r.id} article={r} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
