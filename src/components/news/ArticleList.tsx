import { Ad } from "@/components/ads/Ad";
import type { Article } from "@/lib/types";
import { ArticleCard, EmptyState, LeadStory } from "./ArticleCard";

/** Página de listado (isla, sección): la más reciente destacada y el resto en lista o rejilla. */
export function ArticleList({ title, intro, items, empty }: { title: string; intro?: string; items: Article[]; empty: string }) {
  const [first, ...rest] = items;
  return (
    <>
      <header className="mb-6 border-b-[3px] border-ink pb-3">
        <h1 className="headline text-[2rem] sm:text-5xl">{title}</h1>
        {intro && <p className="mt-2 text-ink-2">{intro}</p>}
      </header>
      {first ? (
        <>
          <LeadStory article={first} />
          {rest.length > 0 && (
            <div className="mt-8 grid divide-y divide-line border-t border-line pt-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 sm:divide-y-0 lg:grid-cols-3 [&>*]:py-4 sm:[&>*]:py-0 [&>*:first-child]:pt-0">
              {rest.slice(0, 6).map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
              {rest.length > 6 && <Ad slot="home" className="sm:col-span-2 lg:col-span-3" />}
              {rest.slice(6, 60).map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          )}
        </>
      ) : (
        <EmptyState>{empty}</EmptyState>
      )}
    </>
  );
}
