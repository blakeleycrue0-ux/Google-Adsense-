import type { Metadata } from "next";
import Link from "next/link";
import { Ad } from "@/components/ads/Ad";
import { AffiliateNote } from "@/components/commerce/AffiliateNote";
import { DealList } from "@/components/commerce/DealList";
import { PageHeader } from "@/components/site/PageHeader";
import { getDeals, getStoreMap } from "@/lib/content";
import type { Deal } from "@/lib/types";

export const metadata: Metadata = {
  title: "Ofertas tecnológicas verificadas",
  description: "Descuentos en móviles, auriculares, portátiles y más, con tienda, precio y fecha de comprobación.",
  alternates: { canonical: "/ofertas" },
};

const TYPES: { id: Deal["productType"] | "todas"; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "movil", label: "📱 Móviles" },
  { id: "auriculares", label: "🎧 Auriculares" },
  { id: "portatil", label: "💻 Portátiles" },
  { id: "tablet", label: "Tabletas" },
  { id: "reloj", label: "⌚ Relojes" },
];

export default async function DealsPage({ searchParams }: PageProps<"/ofertas">) {
  const tipoRaw = (await searchParams).tipo;
  const tipo = (Array.isArray(tipoRaw) ? tipoRaw[0] : tipoRaw) ?? "todas";
  const [deals, stores] = await Promise.all([getDeals(), getStoreMap()]);
  const filtered = tipo === "todas" ? deals : deals.filter((d) => d.productType === tipo);
  return (
    <>
      <PageHeader
        kicker="Compras"
        emoji="🛍️"
        title="Ofertas tecnológicas"
        description="Cada oferta indica la tienda, el precio y cuándo lo comprobamos. Si no hemos verificado el precio anterior, no mostramos porcentaje de descuento."
      >
        <nav aria-label="Tipo de producto" className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {TYPES.map((t) => (
            <Link
              key={t.id}
              href={t.id === "todas" ? "/ofertas" : `/ofertas?tipo=${t.id}`}
              aria-current={tipo === t.id ? "page" : undefined}
              scroll={false}
              className="inline-flex h-9 shrink-0 items-center rounded-sm border border-line px-3.5 text-[14px] transition-colors hover:border-ink aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-paper"
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </PageHeader>
      <div className="container-x mt-10 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <DealList deals={filtered} stores={stores} />
          <AffiliateNote className="mt-4" />
        </div>
        <aside className="lg:col-span-4">
          <div className="rounded-md bg-surface p-6">
            <p className="text-[15px] font-semibold">Cómo seleccionamos las ofertas 👀</p>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-muted">
              <li>Comprobamos el precio en la tienda y anotamos la fecha.</li>
              <li>Solo indicamos «precio anterior» si la tienda lo muestra de forma verificable.</li>
              <li>Retiramos las ofertas caducadas automáticamente.</li>
              <li>Algunos enlaces son de afiliado; no cambian el precio.</li>
            </ul>
          </div>
          <div className="sticky top-[calc(var(--header-h)+24px)] mt-10">
            <Ad placement="sidebar" />
          </div>
        </aside>
      </div>
    </>
  );
}
