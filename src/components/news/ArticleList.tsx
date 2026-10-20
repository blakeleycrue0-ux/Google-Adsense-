import { Ad } from "@/components/ads/Ad";
import type { Article } from "@/lib/types";
import { ArticleCard, EmptyState } from "./ArticleCard";

/** Página de listado (isla, sección, última hora): título y noticias de la más reciente a la más antigua. */
export function ArticleList({ title, intro, items, empty }: { title: string; intro?: string; items: Article[]; empty: string }) {
  return (
    <>
      <header className="mb-8 border-b-2 border-ink pb-4">
        <h1 className="headline text-3xl sm:text-4xl">{title}</h1>
        {intro && <p className="mt-2 text-ink-2">{intro}</p>}
      </header>
      {items.length ? (
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((a, i) => (
            <ArticleCard key={a.id} article={a} priority={i < 3} />
          ))}
          {items.length > 6 && <Ad slot="home" className="sm:col-span-2 lg:col-span-3" />}
          {items.slice(6, 60).map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      ) : (
        <EmptyState>{empty}</EmptyState>
      )}
    </>
  );
}
