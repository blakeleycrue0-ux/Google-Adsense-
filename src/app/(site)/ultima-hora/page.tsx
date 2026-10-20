import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, Kicker } from "@/components/news/ArticleCard";
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
      <header className="mb-6 border-b-[3px] border-ink pb-3">
        <h1 className="headline flex items-center gap-3 text-[2rem] sm:text-5xl">
          <span className="live-dot size-3 rounded-full bg-ink" aria-hidden />
          Última hora
        </h1>
        <p className="mt-2 text-ink-2">Las noticias más recientes de las islas, de la más nueva a la más antigua.</p>
      </header>
      {items.length ? (
        <ol className="relative ml-1.5 space-y-7 border-l border-line pl-5">
          {items.map((a) => (
            <li key={a.id} className="relative">
              <span className={`absolute -left-[26.5px] top-1 size-3 rounded-full ring-4 ring-paper ${a.breaking ? "bg-ink" : "border-2 border-ink bg-paper"}`} aria-hidden />
              <time dateTime={a.publishedAt} className="font-mono text-xs font-semibold">
                {formatSmart(a.publishedAt!)}
              </time>
              <Link href={`/noticia/${a.slug}`} className="group mt-1 block space-y-1">
                <Kicker article={a} />
                <h2 className="headline text-xl group-hover:underline">{a.title}</h2>
                <p className="text-[15px] leading-relaxed text-ink-2">{a.summary}</p>
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
