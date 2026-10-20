import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { DEFAULT_SITE_NAME, DEFAULT_TAGLINE } from "@/lib/site";
import type { Settings } from "@/lib/types";

export const DEFAULT_SETTINGS: Settings = {
  siteName: DEFAULT_SITE_NAME,
  tagline: DEFAULT_TAGLINE,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || "http://localhost:3000",
  ownerName: "",
  ownerNif: "",
  ownerAddress: "",
  contactEmail: "",
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "",
  adsEnabled: false,
  slots: { home: "", article: "" },
  searchConsoleVerification: "",
};

export const getSettings = cache(async (): Promise<Settings> => {
  const stored = await db()
    .getSettings()
    .catch(() => null);
  return { ...DEFAULT_SETTINGS, ...stored, slots: { ...DEFAULT_SETTINGS.slots, ...stored?.slots } };
});

export const validAdsenseClient = (c: string) => /^ca-pub-\d{10,20}$/.test(c);

export const adsActive = (s: Settings) => s.adsEnabled && validAdsenseClient(s.adsenseClient);

export function absoluteUrl(s: Settings, path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return s.siteUrl.replace(/\/$/, "") + path;
}
