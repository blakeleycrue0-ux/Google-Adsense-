import type { Phone, PerformanceTier } from "@/lib/types";

export const phoneName = (p: Pick<Phone, "brand" | "model">) => `${p.brand} ${p.model}`;
export const phoneHref = (p: Pick<Phone, "slug">) => `/moviles/${p.slug}`;

export function lowestOffer(phone: Pick<Phone, "offers">) {
  return [...phone.offers].sort((a, b) => a.price - b.price)[0] ?? null;
}

export const TIER_LABEL: Record<PerformanceTier, string> = {
  basica: "Básico",
  media: "Medio",
  alta: "Alto",
  tope: "Tope de gama",
};
export const TIER_ORDER: PerformanceTier[] = ["basica", "media", "alta", "tope"];

export function keySpecs(p: Phone) {
  const s = p.specs;
  return [
    { label: "Pantalla", value: `${s.displayInches.toLocaleString("es-ES")}″ ${s.displayType.split(" ")[0]} · ${s.refreshHz} Hz` },
    {
      label: "Cámaras",
      value: [`${s.mainCameraMp} MP`, s.ultrawideMp && `UGA ${s.ultrawideMp} MP`, s.telephotoMp && `Tele ${s.telephotoZoom ?? ""}`]
        .filter(Boolean)
        .join(" · "),
    },
    { label: "Batería", value: `${s.batteryMah.toLocaleString("es-ES")} mAh${s.chargingW ? ` · ${s.chargingW} W` : ""}` },
    { label: "Procesador", value: s.chipset },
  ];
}
