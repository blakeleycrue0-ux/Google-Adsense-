import type { Metadata } from "next";
import { Ad } from "@/components/ads/Ad";
import { ArticleCard, EmptyState, LeadStory, SectionTitle } from "@/components/news/ArticleCard";
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
  const grid = rest.slice(4, 13);
  const shown = new Set([lead, ...side, ...grid].map((a) => a.id));
  const byIsland = ISLANDS.filter((i) => i.id !== "baleares")
    .map((i) => ({ ...i, items: all.filter((a) => a.island === i.id && !shown.has(a.id)).slice(0, 4) }))
    .filter((g) => g.items.length);

  return (
    <>
      {ld}
      <h1 className="sr-only">
        {s.siteName}: {s.tagline}
      </h1>

      <section className="grid gap-6 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          <LeadStory article={lead} />
        </div>
        {side.length > 0 && (
          <div className="border-t border-line pt-5 lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <p className="kicker mb-1 hidden text-muted lg:block">Lo último</p>
            <div className="divide-y divide-line [&>*]:py-4 [&>*:first-child]:pt-0 lg:[&>*:first-child]:pt-3">
              {side.map((a) => (
                <ArticleCard key={a.id} article={a} variant="row" />
              ))}
            </div>
          </div>
        )}
      </section>

      <Ad slot="home" className="my-8" />

      {grid.length > 0 && (
        <section className="mt-8">
          <SectionTitle href="/ultima-hora">Más noticias</SectionTitle>
          <div className="grid divide-y divide-line sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 sm:divide-y-0 lg:grid-cols-3 [&>*]:py-4 sm:[&>*]:py-0 [&>*:first-child]:pt-0">
            {grid.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      {byIsland.length > 0 && (
        <div className="mt-12 grid gap-12 md:grid-cols-2 md:gap-x-10">
          {byIsland.map((g) => (
            <section key={g.id}>
              <SectionTitle href={`/isla/${g.id}`}>{g.name}</SectionTitle>
              <div className="divide-y divide-line [&>*]:py-4 [&>*:first-child]:pt-0">
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
