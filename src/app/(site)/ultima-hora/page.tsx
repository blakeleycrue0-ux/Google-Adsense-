import type { Metadata } from "next";
import Link from "next/link";
import { Kicker } from "@/components/news/ArticleCard";
import { EmptyState } from "@/components/news/ArticleCard";
import { getPublished } from "@/lib/content";
import { formatSmart } from "@/lib/format";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Última hora en Baleares",
  description: "Lo último que está pasando en Mallorca, Menorca, Ibiza y Formentera, minuto a minuto.",
  alternates: { canonical: "/ultima-hora" },
};

/** Línea de tiempo con las 50 noticias más recientes. */
export default async function BreakingPage() {
  const items = (await getPublished()).slice(0, 50);
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 border-b-2 border-ink pb-4">
        <h1 className="headline flex items-center gap-3 text-3xl sm:text-4xl">
          <span className="live-dot size-3 rounded-full bg-live" aria-hidden />
          Última hora
        </h1>
        <p className="mt-2 text-ink-2">Las noticias más recientes de las islas, de la más nueva a la más antigua.</p>
      </header>
      {items.length ? (
        <ol className="relative space-y-8 border-l-2 border-line pl-6">
          {items.map((a) => (
            <li key={a.id} className="relative">
              <span className={`absolute -left-[31px] top-1.5 size-3 rounded-full ring-4 ring-paper ${a.breaking ? "bg-live" : "bg-sea"}`} aria-hidden />
              <time dateTime={a.publishedAt} className="font-mono text-sm text-muted">
                {formatSmart(a.publishedAt!)}
              </time>
              <Link href={`/noticia/${a.slug}`} className="group mt-1 block space-y-1">
                <Kicker article={a} />
                <h2 className="headline text-xl group-hover:text-sea">{a.title}</h2>
                <p className="text-ink-2">{a.summary}</p>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState>Todavía no hay noticias publicadas.</EmptyState>
      )}
    </div>
  );
}
