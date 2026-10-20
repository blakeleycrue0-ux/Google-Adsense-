import type { MetadataRoute } from "next";
import { absoluteUrl, getSettings } from "@/lib/settings";

export const revalidate = 300;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const s = await getSettings();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/buscar"] }],
    sitemap: absoluteUrl(s, "/sitemap.xml"),
  };
}
