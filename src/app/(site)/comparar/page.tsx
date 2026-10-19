import type { Metadata } from "next";
import { Photo } from "@/components/ui/Photo";
import Link from "next/link";
import { AffiliateNote } from "@/components/commerce/AffiliateNote";
import { BuyLink } from "@/components/commerce/BuyLink";
import { ComparePicker, RemoveFromCompare } from "@/components/phones/ComparePicker";
import { PageHeader } from "@/components/site/PageHeader";
import { getPhones, getStoreMap } from "@/lib/content";
import { formatPrice } from "@/lib/format";
import { TIER_LABEL, TIER_ORDER, lowestOffer, phoneHref, phoneName } from "@/lib/phones";
import type { Phone } from "@/lib/types";

export const metadata: Metadata = {
  title: "Comparador de móviles",
  description: "Compara especificaciones, precios y características de hasta cuatro móviles en una tabla clara.",
  alternates: { canonical: "/comparar" },
};

type Row = {
  label: string;
  value: (p: Phone) => string;
  /** Valor numérico para resaltar el mejor (mayor o menor según `better`). */
  num?: (p: Phone) => number | null;
  better?: "high" | "low";
};

const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: "Precio",
    rows: [
      {
        label: "Precio desde",
        value: (p) => {
          const o = lowestOffer(p);
          return o ? `${formatPrice(o.price)}${o.source === "demo" ? " (demo)" : ""}` : "—";
        },
        num: (p) => lowestOffer(p)?.price ?? null,
        better: "low",
      },
    ],
  },
  {
    title: "Pantalla",
    rows: [
      { label: "Tamaño", value: (p) => `${p.specs.displayInches.toLocaleString("es-ES")}″` },
      { label: "Tipo", value: (p) => p.specs.displayType },
      { label: "Resolución", value: (p) => p.specs.resolution },
      { label: "Frecuencia", value: (p) => `${p.specs.refreshHz} Hz`, num: (p) => p.specs.refreshHz, better: "high" },
    ],
  },
  {
    title: "Rendimiento",
    rows: [
      { label: "Procesador", value: (p) => p.specs.chipset },
      { label: "Gama (editorial)", value: (p) => TIER_LABEL[p.performanceTier], num: (p) => TIER_ORDER.indexOf(p.performanceTier), better: "high" },
      { label: "RAM", value: (p) => p.specs.ramGB.map((r) => `${r} GB`).join(" / "), num: (p) => Math.max(...p.specs.ramGB), better: "high" },
      {
        label: "Almacenamiento",
        value: (p) => p.specs.storageGB.map((s) => (s >= 1024 ? `${s / 1024} TB` : `${s} GB`)).join(" / "),
      },
    ],
  },
  {
    title: "Cámaras",
    rows: [
      { label: "Principal", value: (p) => `${p.specs.mainCameraMp} MP` },
      { label: "Ultra gran angular", value: (p) => (p.specs.ultrawideMp ? `${p.specs.ultrawideMp} MP` : "—") },
      { label: "Teleobjetivo", value: (p) => (p.specs.telephotoMp ? `${p.specs.telephotoMp} MP · ${p.specs.telephotoZoom ?? ""}` : "—") },
      { label: "Frontal", value: (p) => `${p.specs.frontCameraMp} MP` },
    ],
  },
  {
    title: "Batería",
    rows: [
      { label: "Capacidad", value: (p) => `${p.specs.batteryMah.toLocaleString("es-ES")} mAh`, num: (p) => p.specs.batteryMah, better: "high" },
      { label: "Carga por cable", value: (p) => (p.specs.chargingW ? `${p.specs.chargingW} W` : "No especificada"), num: (p) => p.specs.chargingW ?? null, better: "high" },
    ],
  },
  {
    title: "General",
    rows: [
      { label: "Sistema", value: (p) => (p.os === "ios" ? "iOS" : "Android") },
      { label: "Actualizaciones anunciadas", value: (p) => (p.specs.osUpdatesYears ? `${p.specs.osUpdatesYears} años` : "Sin compromiso público"), num: (p) => p.specs.osUpdatesYears ?? null, better: "high" },
      { label: "Resistencia", value: (p) => p.specs.ipRating ?? "—" },
      { label: "Peso", value: (p) => `${p.specs.weightG} g`, num: (p) => p.specs.weightG, better: "low" },
      { label: "Lanzamiento", value: (p) => String(p.releaseYear) },
    ],
  },
];

export default async function ComparePage({ searchParams }: PageProps<"/comparar">) {
  const raw = (await searchParams).m;
  const slugs = [...new Set((Array.isArray(raw) ? raw.join(",") : raw ?? "").split(",").filter(Boolean))].slice(0, 4);
  const [all, stores] = await Promise.all([getPhones(), getStoreMap()]);
  const phones = slugs.map((s) => all.find((p) => p.slug === s)).filter(Boolean) as Phone[];
  const selected = phones.map((p) => p.slug);
  const options = all.map((p) => ({ slug: p.slug, name: phoneName(p) }));

  const bestIndexes = (row: Row) => {
    if (!row.num || phones.length < 2) return new Set<number>();
    const vals = phones.map(row.num);
    const valid = vals.filter((v): v is number => v !== null);
    if (valid.length < 2 || new Set(valid).size === 1) return new Set<number>();
    const target = row.better === "low" ? Math.min(...valid) : Math.max(...valid);
    return new Set(vals.flatMap((v, i) => (v === target ? [i] : [])));
  };

  return (
    <>
      <PageHeader
        kicker="Herramienta"
        emoji="⚖️"
        title="Comparador"
        description="Elige hasta cuatro móviles. Marcamos el valor más favorable de cada fila cuando la comparación es objetiva (más batería, menos peso…)."
      >
        <div className="mt-8">
          <ComparePicker options={options} selected={selected} />
        </div>
      </PageHeader>

      <div className="container-x mt-10">
        {phones.length === 0 && (
          <div className="rounded-sm border border-dashed border-line-strong px-6 py-14 text-center">
            <p className="text-[17px] font-medium">Aún no has elegido ningún móvil</p>
            <p className="mt-1 text-[14px] text-muted">Usa el selector de arriba o el buscador para añadir modelos.</p>
            <Link href="/moviles" className="btn-primary mt-5">
              Ir al buscador de móviles
            </Link>
          </div>
        )}

        {phones.length > 0 && (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[640px] border-collapse text-[14px]">
              <caption className="sr-only">Comparativa de {phones.map(phoneName).join(", ")}</caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 w-[150px] bg-paper sm:w-[200px]">
                    <span className="sr-only">Característica</span>
                  </th>
                  {phones.map((p) => {
                    const o = lowestOffer(p);
                    const store = o ? stores.get(o.storeId) : undefined;
                    return (
                      <th key={p.id} scope="col" className="min-w-[170px] border-l border-line px-4 pb-6 text-left align-top font-normal">
                        <Link href={phoneHref(p)} className="group block">
                          <div className="relative mx-auto aspect-[4/5] w-full max-w-[140px] overflow-hidden rounded-sm bg-surface">
                            <Photo image={p.image} fit="contain" sizes="140px" className="p-2" />
                          </div>
                          <p className="kicker mt-4 text-muted">{p.brand}</p>
                          <p className="mt-1 text-[17px] font-semibold leading-tight tracking-[-0.02em]">
                            <span className="link-title">{p.model}</span>
                          </p>
                        </Link>
                        <div className="mt-3 flex flex-col items-start gap-2">
                          {o && (
                            <BuyLink linkId={o.linkId} variant="secondary" className="btn-sm">
                              {store?.name ?? "Tienda"}
                            </BuyLink>
                          )}
                          <RemoveFromCompare slug={p.slug} selected={selected} />
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              {GROUPS.map((g) => (
                <tbody key={g.title}>
                  <tr>
                    <th colSpan={phones.length + 1} scope="colgroup" className="sticky left-0 border-b-2 border-ink bg-paper pb-2 pt-8 text-left">
                      <span className="kicker text-ink">{g.title}</span>
                    </th>
                  </tr>
                  {g.rows.map((row) => {
                    const best = bestIndexes(row);
                    return (
                      <tr key={row.label} className="transition-colors hover:bg-surface/60">
                        <th scope="row" className="sticky left-0 z-10 border-b border-line bg-paper py-3 pr-4 text-left text-[13px] font-normal text-muted">
                          {row.label}
                        </th>
                        {phones.map((p, i) => (
                          <td key={p.id} className={`border-b border-l border-line px-4 py-3 align-top ${best.has(i) ? "font-semibold" : ""}`}>
                            {row.value(p)}
                            {best.has(i) && (
                              <span className="ml-1.5 inline-block rounded-xs bg-ink px-1 align-middle font-mono text-[9px] uppercase text-paper" title="Valor más favorable de la fila">
                                ▲
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          </div>
        )}
        {phones.length === 1 && <p className="mt-6 text-[14px] text-muted">Añade al menos otro móvil para ver diferencias.</p>}
        {phones.length > 0 && <AffiliateNote className="mt-8" />}
      </div>
    </>
  );
}
