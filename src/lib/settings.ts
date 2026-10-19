import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { AdPlacement, AdSlotSetting, Settings } from "@/lib/types";

export const AD_PLACEMENTS: { id: AdPlacement; label: string; description: string }[] = [
  { id: "home-after-hero", label: "Portada · tras destacados", description: "Banda horizontal bajo las noticias principales." },
  { id: "home-mid", label: "Portada · mitad", description: "Entre las secciones de móviles y ofertas." },
  { id: "article-inline", label: "Artículo · dentro del texto", description: "Tras el segundo apartado del artículo." },
  { id: "article-end", label: "Artículo · final", description: "Después del cuerpo y antes de las noticias relacionadas." },
  { id: "sidebar", label: "Barra lateral", description: "Columna lateral en escritorio (artículos y listados)." },
  { id: "listing", label: "Listados", description: "Entre resultados de categorías y búsquedas." },
];

const emptySlot = (): AdSlotSetting => ({ slotId: "", enabled: false, format: "auto" });

export function defaultSettings(): Settings {
  return {
    siteName: "Voltio",
    tagline: "Tecnología, sin ruido.",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    contactEmail: "",
    demoMode: true,
    analytics: {
      gaMeasurementId: process.env.NEXT_PUBLIC_GA_ID || "",
      searchConsoleVerification: process.env.GOOGLE_SITE_VERIFICATION || "",
    },
    ads: {
      enabled: Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT),
      client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "",
      showPlaceholders: false,
      slots: Object.fromEntries(AD_PLACEMENTS.map((p) => [p.id, emptySlot()])) as Settings["ads"]["slots"],
    },
    consent: { mode: "builtin" },
    affiliates: {
      disclosure:
        "Algunos enlaces son de afiliado: si compras a través de ellos podemos recibir una comisión, sin coste adicional para ti.",
    },
    legal: { ownerName: "", taxId: "", address: "", registry: "" },
    social: { x: "", instagram: "", youtube: "" },
    updatedAt: new Date(0).toISOString(),
  };
}

/** Ajustes guardados combinados con los valores por defecto (y variables de entorno). */
export const getSettings = cache(async (): Promise<Settings> => {
  const base = defaultSettings();
  const saved = await db().getSettings();
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    siteUrl: saved.siteUrl || base.siteUrl,
    analytics: {
      gaMeasurementId: saved.analytics?.gaMeasurementId || base.analytics.gaMeasurementId,
      searchConsoleVerification: saved.analytics?.searchConsoleVerification || base.analytics.searchConsoleVerification,
    },
    ads: {
      ...base.ads,
      ...saved.ads,
      client: saved.ads?.client || base.ads.client,
      slots: { ...base.ads.slots, ...saved.ads?.slots },
    },
    consent: { ...base.consent, ...saved.consent },
    affiliates: { ...base.affiliates, ...saved.affiliates },
    legal: { ...base.legal, ...saved.legal },
    social: { ...base.social, ...saved.social },
  };
});

export function absoluteUrl(settings: Settings, path = "/") {
  return new URL(path, settings.siteUrl.replace(/\/$/, "") + "/").toString();
}

/** AdSense solo se activa con un ID de editor con formato válido. */
export function adsActive(s: Settings) {
  return s.ads.enabled && /^ca-pub-\d{10,20}$/.test(s.ads.client);
}
