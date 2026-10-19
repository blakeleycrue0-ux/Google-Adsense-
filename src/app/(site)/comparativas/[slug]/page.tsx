import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Ad } from "@/components/ads/Ad";
import { AffiliateNote } from "@/components/commerce/AffiliateNote";
import { PhoneRow } from "@/components/phones/PhoneRow";
import { PageHeader } from "@/components/site/PageHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { DemoBadge } from "@/components/ui/Badge";
import { getGuideBySlug, getGuides, getPhones, getStoreMap } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { phoneName } from "@/lib/phones";
import { breadcrumbLd } from "@/lib/seo";
import { absoluteUrl, getSettings } from "@/lib/settings";
import type { Phone } from "@/lib/types";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getGuides()).map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/comparativas/[slug]">): Promise<Metadata> {
  const g = await getGuideBySlug((await params).slug);
  if (!g) return { title: "Guía no encontrada" };
  return { title: `${g.title}: guía de compra`, description: g.intro, alternates: { canonical: `/comparativas/${g.slug}` } };
}

export default async function GuidePage({ params }: PageProps<"/comparativas/[slug]">) {
  const g = await getGuideBySlug((await params).slug);
  if (!g) notFound();
  const [all, stores, settings, guides] = await Promise.all([getPhones(), getStoreMap(), getSettings(), getGuides()]);
  const phones = g.phoneIds.map((id) => all.find((p) => p.id === id)).filter(Boolean) as Phone[];
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd(settings, [
            { name: "Inicio", path: "/" },
            { name: "Comparativas", path: "/comparativas" },
            { name: g.title, path: `/comparativas/${g.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: g.title,
            itemListElement: phones.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(settings, `/moviles/${p.slug}`), name: phoneName(p) })),
          },
        ]}
      />
      <PageHeader kicker="Guía de compra" emoji={g.emoji} title={g.title} description={g.intro}>
        <p className="mt-5 flex items-center gap-3 text-[13px] text-muted">
          Actualizada el {formatDate(g.updatedAt)} {g.isDemo && <DemoBadge />}
        </p>
      </PageHeader>
      <div className="container-x mt-10 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="prose-article prose-compact" dangerouslySetInnerHTML={{ __html: renderMarkdown(g.body) }} />
          <h2 className="kicker mt-14 border-t-2 border-ink pt-4 text-ink">Nuestra selección · {phones.length} modelos</h2>
          <div>
            {phones.map((p, i) => (
              <PhoneRow key={p.id} phone={p} stores={stores} rank={i + 1} />
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
            <AffiliateNote />
            <Link href={`/comparar?m=${phones.slice(0, 4).map((p) => p.slug).join(",")}`} className="btn-secondary btn-sm">
              Comparar esta selección
            </Link>
          </div>
        </div>
        <aside className="space-y-10 lg:col-span-4">
          <nav aria-label="Otras guías">
            <p className="kicker border-t-2 border-ink pt-4 text-ink">Otras guías</p>
            <ul className="mt-3 divide-y divide-line">
              {guides
                .filter((x) => x.id !== g.id)
                .map((x) => (
                  <li key={x.id}>
                    <Link href={`/comparativas/${x.slug}`} className="group block py-3 text-[15px] font-medium">
                      {x.emoji} <span className="link-title">{x.title}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
          <div className="sticky top-[calc(var(--header-h)+24px)]">
            <Ad placement="sidebar" />
          </div>
        </aside>
      </div>
    </>
  );
}
