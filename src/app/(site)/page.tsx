import type { Metadata } from "next";
import { Ad } from "@/components/ads/Ad";
import { EmptyState, LeadRecipe, RecipeCard, RecipeGrid, SectionTitle } from "@/components/recipes/RecipeCard";
import { getPublished } from "@/lib/content";
import { websiteLd } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { CATEGORIES } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [s, all] = await Promise.all([getSettings(), getPublished()]);
  const ld = <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd(s)) }} />;

  if (!all.length) {
    return (
      <>
        {ld}
        <h1 className="sr-only">{s.siteName}</h1>
        <EmptyState>Pronto habrá recetas aquí.</EmptyState>
      </>
    );
  }

  // La destacada es la más reciente con foto.
  const lead = all.slice(0, 6).find((r) => r.photo) ?? all[0];
  const rest = all.filter((r) => r !== lead);
  const side = rest.slice(0, 4);
  const latest = rest.slice(4, 13);
  const byCategory = CATEGORIES.map((c) => ({ ...c, items: all.filter((r) => r.category === c.id && r !== lead).slice(0, 4) })).filter(
    (g) => g.items.length >= 2,
  );

  return (
    <>
      {ld}
      <h1 className="sr-only">
        {s.siteName}: {s.tagline}
      </h1>

      <section className="grid gap-6 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          <LeadRecipe recipe={lead} />
        </div>
        {side.length > 0 && (
          <div className="border-t border-line pt-5 lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <p className="kicker mb-1 hidden text-muted lg:block">Últimas recetas</p>
            <div className="divide-y divide-line [&>*]:py-4 [&>*:first-child]:pt-0 lg:[&>*:first-child]:pt-3">
              {side.map((r) => (
                <RecipeCard key={r.id} recipe={r} variant="row" />
              ))}
            </div>
          </div>
        )}
      </section>

      <Ad slot="home" className="my-8" />

      {latest.length > 0 && (
        <section className="mt-8">
          <SectionTitle href="/recetas">Más recetas</SectionTitle>
          <RecipeGrid recipes={latest} />
        </section>
      )}

      {byCategory.map((g) => (
        <section key={g.id} className="mt-12">
          <SectionTitle href={`/recetas/${g.id}`}>{g.name}</SectionTitle>
          <RecipeGrid recipes={g.items} cols={4} />
        </section>
      ))}
    </>
  );
}
