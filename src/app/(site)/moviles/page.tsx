import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AffiliateNote } from "@/components/commerce/AffiliateNote";
import { PhoneFinder } from "@/components/phones/PhoneFinder";
import { TextStory } from "@/components/news/Story";
import { PageHeader } from "@/components/site/PageHeader";
import { ArrowRight } from "@/components/ui/Icons";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getCategoryMap, getGuides, getPosts } from "@/lib/content";
import { getPhoneLites } from "@/lib/phone-lite";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Buscador de móviles: encuentra el tuyo por presupuesto y características",
  description:
    "Filtra móviles por precio, marca, cámara, batería, rendimiento, pantalla, almacenamiento y sistema operativo, y compáralos lado a lado.",
  alternates: { canonical: "/moviles" },
};

export default async function PhonesPage() {
  const [phones, guides, news, cats] = await Promise.all([
    getPhoneLites(),
    getGuides(),
    getPosts({ categoryId: "cat-moviles", limit: 4 }),
    getCategoryMap(),
  ]);
  return (
    <>
      <PageHeader
        kicker="Herramienta"
        emoji="📱"
        title="Encuentra tu móvil"
        description="Filtra por lo que de verdad te importa y selecciona hasta cuatro modelos para compararlos. Las fichas recogen especificaciones del fabricante; no inventamos puntuaciones."
      >
        <nav aria-label="Guías por presupuesto" className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {guides.map((g) => (
            <Link
              key={g.id}
              href={`/comparativas/${g.slug}`}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm bg-surface px-3.5 text-[14px] transition-colors hover:bg-surface-2"
            >
              {g.emoji && <span aria-hidden>{g.emoji}</span>}
              {g.title}
            </Link>
          ))}
        </nav>
      </PageHeader>

      <div className="container-x mt-10">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-sm bg-surface" />}>
          <PhoneFinder phones={phones} />
        </Suspense>
        <AffiliateNote className="mt-6" />
      </div>

      {news.length > 0 && (
        <section className="container-x mt-20" aria-labelledby="noticias-moviles">
          <SectionHeader title="Actualidad de móviles" id="noticias-moviles" href="/categoria/moviles" />
          <ul className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {news.map((p) => (
              <li key={p.id}>
                <TextStory post={p} category={cats.get(p.categoryId)} showSubtitle />
              </li>
            ))}
          </ul>
          <Link href="/comparativas" className="mt-10 inline-flex items-center gap-1.5 text-[14px] font-medium">
            Ver todas las guías de compra <ArrowRight width={15} height={15} />
          </Link>
        </section>
      )}
    </>
  );
}
