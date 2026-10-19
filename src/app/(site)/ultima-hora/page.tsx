import type { Metadata } from "next";
import Link from "next/link";
import { Ad } from "@/components/ads/Ad";
import { ListingAside } from "@/components/news/ListingAside";
import { pageFrom } from "@/components/news/PostList";
import { postHref } from "@/components/news/Story";
import { PageHeader } from "@/components/site/PageHeader";
import { getCategoryMap, getPublishedPosts } from "@/lib/content";
import { formatLongDate, formatTime, madridDayKey } from "@/lib/format";

export const metadata: Metadata = {
  title: "Última hora en tecnología",
  description: "Toda la actualidad tecnológica en orden cronológico, con hora de publicación y categoría.",
  alternates: { canonical: "/ultima-hora" },
};

const PER_PAGE = 30;

export default async function LatestPage({ searchParams }: PageProps<"/ultima-hora">) {
  const page = pageFrom((await searchParams).pagina);
  const [posts, cats] = await Promise.all([getPublishedPosts(), getCategoryMap()]);
  const pages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  const slice = posts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const groups = new Map<string, typeof slice>();
  for (const p of slice) {
    const k = madridDayKey(new Date(p.publishedAt!));
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }

  return (
    <>
      <PageHeader kicker="Actualidad" emoji="⚡" title="Última hora" description="Todas las publicaciones, de la más reciente a la más antigua." />
      <div className="container-x mt-12 grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          {!slice.length && <p className="text-muted">Todavía no hay publicaciones.</p>}
          {[...groups.entries()].map(([day, items], gi) => (
            <section key={day} className="mb-12" aria-label={formatLongDate(items[0].publishedAt!)}>
              <h2 className="sticky top-[var(--header-h)] z-10 -mx-1 bg-paper/95 px-1 py-3 text-[15px] font-semibold capitalize tracking-[-0.01em] backdrop-blur">
                {formatLongDate(items[0].publishedAt!)}
              </h2>
              <ol className="border-l border-line">
                {items.map((p) => (
                  <li key={p.id} className="relative pl-6 sm:pl-8">
                    <span aria-hidden className="absolute -left-[4px] top-[26px] size-[7px] rounded-full border border-ink bg-paper" />
                    <Link href={postHref(p)} className="group grid gap-1 border-b border-line py-5 sm:grid-cols-[72px_1fr] sm:gap-4">
                      <time dateTime={p.publishedAt} className="font-mono text-[13px] font-medium tabular-nums">
                        {formatTime(p.publishedAt!)}
                      </time>
                      <span>
                        <span className="kicker text-muted">
                          {p.isBreaking && <span className="mr-2 text-live">● Última hora</span>}
                          {cats.get(p.categoryId)?.name}
                        </span>
                        <span className="mt-1.5 block text-[18px] font-semibold leading-snug tracking-[-0.015em]">
                          <span className="link-title">{p.title}</span>
                        </span>
                        <span className="mt-1.5 line-clamp-2 block text-[14px] text-muted">{p.subtitle}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
              {gi === 0 && <Ad placement="listing" className="mt-10" />}
            </section>
          ))}
          {pages > 1 && (
            <nav aria-label="Paginación" className="flex justify-between border-t border-line pt-5">
              {page > 1 ? <Link className="btn-secondary btn-sm" href={`/ultima-hora?pagina=${page - 1}`}>← Más recientes</Link> : <span />}
              {page < pages ? <Link className="btn-secondary btn-sm" href={`/ultima-hora?pagina=${page + 1}`}>Anteriores →</Link> : <span />}
            </nav>
          )}
        </div>
        <div className="lg:col-span-4">
          <ListingAside />
        </div>
      </div>
    </>
  );
}
