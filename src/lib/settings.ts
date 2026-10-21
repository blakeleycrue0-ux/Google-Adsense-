import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { DEFAULT_SITE_NAME, DEFAULT_TAGLINE, LEGACY_SITE_NAMES, LEGACY_TAGLINES } from "@/lib/site";
import type { Settings } from "@/lib/types";

export const DEFAULT_SETTINGS: Settings = {
  siteName: DEFAULT_SITE_NAME,
  tagline: DEFAULT_TAGLINE,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || "http://localhost:3000",
  about: "",
  instagram: "",
  tiktok: "",
  ownerName: "",
  ownerNif: "",
  ownerAddress: "",
  contactEmail: "",
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "",
  adsEnabled: false,
  slots: { home: "", article: "" },
  searchConsoleVerification: "",
  pexelsKey: "",
};

export const getSettings = cache(async (): Promise<Settings> => {
  const stored = await db()
    .getSettings()
    .catch(() => null);
  const s = { ...DEFAULT_SETTINGS, ...stored, slots: { ...DEFAULT_SETTINGS.slots, ...stored?.slots } };
  // Datos del titular: si no se han escrito en Ajustes, se toman de las variables de
  // entorno de Netlify (así no quedan en el repositorio, que es público).
  s.ownerName ||= process.env.OWNER_NAME ?? "";
  s.ownerNif ||= process.env.OWNER_NIF ?? "";
  s.ownerAddress ||= process.env.OWNER_ADDRESS ?? "";
  s.contactEmail ||= process.env.CONTACT_EMAIL ?? "";
  // La web empezó como diario de noticias: si sigue guardado aquel nombre, se usa el nuevo.
  if (!s.siteName || LEGACY_SITE_NAMES.includes(s.siteName)) s.siteName = DEFAULT_SITE_NAME;
  if (!s.tagline || LEGACY_TAGLINES.includes(s.tagline)) s.tagline = DEFAULT_TAGLINE;
  // Si la dirección guardada es la de un nombre anterior de Netlify (*.netlify.app distinto
  // del actual), se usa la actual: Netlify la da en URL y no deja de funcionar al renombrar.
  const current = process.env.URL;
  if (current && /\.netlify\.app$/.test(new URL(s.siteUrl).hostname) && new URL(current).hostname.endsWith(".netlify.app") && new URL(s.siteUrl).hostname !== new URL(current).hostname) {
    s.siteUrl = current;
  }
  return s;
});

export const validAdsenseClient = (c: string) => /^ca-pub-\d{10,20}$/.test(c);

export const adsActive = (s: Settings) => s.adsEnabled && validAdsenseClient(s.adsenseClient);

export function absoluteUrl(s: Settings, path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return s.siteUrl.replace(/\/$/, "") + path;
}
