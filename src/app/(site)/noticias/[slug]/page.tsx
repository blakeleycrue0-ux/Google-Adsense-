import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Ad } from "@/components/ads/Ad";
import { ReadingProgress } from "@/components/news/ReadingProgress";
import { ShareButtons } from "@/components/news/ShareButtons";
import { RowStory } from "@/components/news/Story";
import { ViewTracker } from "@/components/news/ViewTracker";
import { JsonLd } from "@/components/seo/JsonLd";
import { ArrowUpRight } from "@/components/ui/Icons";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getAuthor, getCategoryMap, getPostBySlug, getPublishedPosts, getRelated, tagSlug } from "@/lib/content";
import { formatDateTime, formatLongDate, formatTime, readingMinutes } from "@/lib/format";
import { renderMarkdownSections } from "@/lib/markdown";
import { articleLd, breadcrumbLd } from "@/lib/seo";
import { absoluteUrl, getSettings } from "@/lib/settings";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getPublishedPosts()).slice(0, 50).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/noticias/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Noticia no encontrada" };
  const author = await getAuthor(post.authorId);
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.subtitle;
  return {
    title,
    description,
    alternates: { canonical: `/noticias/${post.slug}` },
    keywords: post.tags,
    openGraph: {
      type: "article",
      title,
      description,
      url: `/noticias/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: author ? [author.name] : undefined,
      tags: post.tags,
      images: [{ url: post.cover.src, width: post.cover.width ?? 1600, height: post.cover.height ?? 1000, alt: post.cover.alt }],
    },
    twitter: { card: "summary_large_image", title, description, images: [post.cover.src] },
  };
}

export default async function ArticlePage({ params }: PageProps<"/noticias/[slug]">) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [settings, author, cats, related] = await Promise.all([
    getSettings(),
    getAuthor(post.authorId),
    getCategoryMap(),
    getRelated(post, 3),
  ]);
  const category = cats.get(post.categoryId);
  const { parts, headings } = renderMarkdownSections(post.body);
  const url = absoluteUrl(settings, `/noticias/${post.slug}`);
  const updated = post.publishedAt && new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime() > 10 * 60_000;
  // Anuncio integrado tras el segundo apartado (solo si el texto es suficientemente largo).
  const inlineAdAfter = parts.length >= 4 ? 2 : -1;

  return (
    <>
      <JsonLd
        data={[
          articleLd(settings, post, author, category),
          breadcrumbLd(settings, [
            { name: "Inicio", path: "/" },
            ...(category ? [{ name: category.name, path: `/categoria/${category.slug}` }] : []),
            { name: post.title, path: `/noticias/${post.slug}` },
          ]),
        ]}
      />
      <ViewTracker postId={post.id} />
      <ReadingProgress targetId="article-body" />

      <article className="pt-8 sm:pt-12">
        <header className="container-x">
          <div className="mx-auto max-w-[900px]">
            <nav aria-label="Ruta" className="kicker flex flex-wrap items-center gap-2 text-muted">
              <Link href="/" className="hover:text-ink">
                Inicio
              </Link>
              <span aria-hidden>/</span>
              {category && (
                <Link href={`/categoria/${category.slug}`} className="text-ink hover:underline">
                  {category.name}
                </Link>
              )}
              {post.isBreaking && (
                <span className="ml-2 inline-flex items-center gap-1.5 text-live">
                  <span className="live-dot" aria-hidden /> Última hora
                </span>
              )}
            </nav>
            <h1 className="headline mt-5 text-[34px] sm:text-[48px] lg:text-[58px]">{post.title}</h1>
            <p className="pretty mt-5 max-w-[62ch] text-[19px] leading-[1.55] text-ink-2 sm:text-[21px]">{post.subtitle}</p>

            <div className="mt-8 flex flex-col gap-5 border-y border-line py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-ink text-[14px] font-semibold text-paper" aria-hidden>
                  {author?.name.charAt(0) ?? "R"}
                </span>
                <div className="text-[13px] leading-snug">
                  <p>
                    Por{" "}
                    {author ? (
                      <Link href={`/autor/${author.slug}`} className="font-semibold hover:underline">
                        {author.name}
                      </Link>
                    ) : (
                      <span className="font-semibold">{settings.siteName}</span>
                    )}
                  </p>
                  <p className="text-muted">
                    <time dateTime={post.publishedAt} title={formatLongDate(post.publishedAt!)}>
                      {formatDateTime(post.publishedAt!)}
                    </time>
                    {updated && (
                      <>
                        {" · "}Actualizado <time dateTime={post.updatedAt}>{formatDateTime(post.updatedAt)}</time>
                      </>
                    )}
                    {" · "}
                    {readingMinutes(post.body)} min de lectura
                  </p>
                </div>
              </div>
              <ShareButtons url={url} title={post.title} />
            </div>
          </div>
        </header>

        <figure className="container-x mt-8">
          <div className="relative mx-auto aspect-[16/10] max-w-[1120px] overflow-hidden rounded-sm bg-surface">
            <Image src={post.cover.src} alt={post.cover.alt} fill priority sizes="(min-width: 1180px) 1120px, 100vw" className="img-reveal object-cover" />
          </div>
          {(post.cover.credit || post.cover.illustrative) && (
            <figcaption className="mx-auto mt-2.5 max-w-[1120px] text-[12px] text-muted">
              {post.cover.alt}. {post.cover.credit ?? "Imagen ilustrativa"}
            </figcaption>
          )}
        </figure>

        <div className="container-x mt-10 sm:mt-14">
          <div className="mx-auto grid max-w-[1120px] gap-12 lg:grid-cols-[minmax(0,680px)_1fr] lg:gap-16 xl:grid-cols-[180px_minmax(0,680px)_1fr]">
            <aside className="hidden xl:block">
              <div className="sticky top-[calc(var(--header-h)+32px)]">
                <p className="kicker text-muted">Compartir</p>
                <div className="mt-3">
                  <ShareButtons url={url} title={post.title} layout="column" />
                </div>
              </div>
            </aside>

            <div id="article-body" className="min-w-0">
              {post.isDemo && (
                <p className="mb-8 rounded-sm border border-dashed border-line-strong bg-surface px-4 py-3 text-[13px] leading-relaxed text-muted">
                  <span className="kicker mr-2 text-ink">Demo</span>
                  Pieza de demostración redactada para la maqueta. Debe revisarse y verificarse antes de publicarse en
                  producción.
                </p>
              )}
              <div className="prose-article">
                {parts.map((html, i) => (
                  <div key={i} className="contents">
                    <div className="[&>*+*]:mt-[1.25em]" dangerouslySetInnerHTML={{ __html: html }} />
                    {i === inlineAdAfter && <Ad placement="article-inline" className="not-prose my-10" />}
                  </div>
                ))}
              </div>

              {post.sources.length > 0 && (
                <section aria-labelledby="fuentes" className="mt-12 border-t border-ink pt-5">
                  <h2 id="fuentes" className="kicker text-ink">
                    📰 Fuentes
                  </h2>
                  <ul className="mt-4 space-y-3">
                    {post.sources.map((s) => (
                      <li key={s.url}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-start gap-2 text-[15px] leading-snug"
                        >
                          <span>
                            <span className="font-medium underline decoration-line-strong underline-offset-4 group-hover:decoration-ink">
                              {s.title}
                            </span>
                            <span className="text-muted"> · {s.publisher}</span>
                          </span>
                          <ArrowUpRight width={14} height={14} className="mt-1 shrink-0 text-muted" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {post.tags.length > 0 && (
                <div className="mt-10 flex flex-wrap items-center gap-2">
                  <span className="kicker mr-1 text-muted">Etiquetas</span>
                  {post.tags.map((t) => (
                    <Link
                      key={t}
                      href={`/etiqueta/${tagSlug(t)}`}
                      className="inline-flex h-8 items-center rounded-sm border border-line px-3 text-[13px] transition-colors hover:border-ink"
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-10 flex flex-col gap-4 border-y border-line py-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[14px] font-medium">¿Te ha resultado útil? Compártelo 👀</p>
                <ShareButtons url={url} title={post.title} />
              </div>

              <p className="mt-6 text-[13px] leading-relaxed text-muted">
                ¿Has visto un error? Escríbenos desde la{" "}
                <Link href={`/contacto?asunto=${encodeURIComponent(`Corrección: ${post.title}`)}`} className="underline underline-offset-2 hover:text-ink">
                  página de contacto
                </Link>
                . Publicado a las {formatTime(post.publishedAt!)}.
              </p>

              <Ad placement="article-end" className="mt-12" />
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-[calc(var(--header-h)+32px)] space-y-10">
                {headings.length > 1 && (
                  <nav aria-label="En este artículo">
                    <p className="kicker text-muted">En este artículo</p>
                    <ol className="mt-4 space-y-2.5 border-l border-line">
                      {headings.map((h) => (
                        <li key={h.id}>
                          <a href={`#${h.id}`} className="-ml-px block border-l border-transparent pl-4 text-[13px] leading-snug text-ink-2 transition-colors hover:border-ink hover:text-ink">
                            {h.text}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                )}
                <Ad placement="sidebar" />
              </div>
            </aside>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="container-x mt-20" aria-labelledby="relacionadas">
          <div className="mx-auto max-w-[1120px]">
            <SectionHeader title="Noticias relacionadas" id="relacionadas" />
            <div className="mt-6 divide-y divide-line">
              {related.map((p) => (
                <div key={p.id} className="py-6 first:pt-2">
                  <RowStory post={p} category={cats.get(p.categoryId)} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
