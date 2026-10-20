import type { Metadata } from "next";
import { Ad } from "@/components/ads/Ad";
import { ArticleCard, EmptyState, SectionTitle } from "@/components/news/ArticleCard";
import { getPublished } from "@/lib/content";
import { organizationLd } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { ISLANDS } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [s, all] = await Promise.all([getSettings(), getPublished()]);
  const ld = <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd(s)) }} />;

  if (!all.length) {
    return (
      <>
        {ld}
        <h1 className="sr-only">{s.siteName}</h1>
        <EmptyState>Todavía no hay noticias publicadas. Vuelve en un rato.</EmptyState>
      </>
    );
  }

  // La principal es la más reciente con foto (si hay alguna entre las 4 últimas).
  const lead = all.slice(0, 4).find((a) => a.photo) ?? all[0];
  const rest = all.filter((a) => a !== lead);
  const side = rest.slice(0, 4);
  const grid = rest.slice(4, 10);
  const shown = new Set([lead, ...side, ...grid].map((a) => a.id));
  const byIsland = ISLANDS.filter((i) => i.id !== "baleares")
    .map((i) => ({ ...i, items: all.filter((a) => a.island === i.id && !shown.has(a.id)).slice(0, 3) }))
    .filter((g) => g.items.length);

  return (
    <>
      {ld}
      <h1 className="sr-only">
        {s.siteName}: {s.tagline}
      </h1>

      <section className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <ArticleCard article={lead} variant="lead" priority />
        </div>
        <div className="space-y-6 lg:col-span-4 lg:border-l lg:border-line lg:pl-8">
          {side.map((a) => (
            <ArticleCard key={a.id} article={a} variant="row" />
          ))}
        </div>
      </section>

      <Ad slot="home" className="my-10" />

      {grid.length > 0 && (
        <section className="mt-12">
          <SectionTitle>Más noticias</SectionTitle>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      {byIsland.length > 0 && (
        <div className="mt-12 grid gap-10 md:grid-cols-2">
          {byIsland.map((g) => (
            <section key={g.id}>
              <SectionTitle href={`/isla/${g.id}`}>{g.name}</SectionTitle>
              <div className="space-y-5">
                {g.items.map((a) => (
                  <ArticleCard key={a.id} article={a} variant="row" />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
