import type { MetadataRoute } from "next";
import { absoluteUrl, getSettings } from "@/lib/settings";

export const revalidate = 300;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const s = await getSettings();
  // Mientras el sitio esté en modo demostración no se permite la indexación.
  if (s.demoMode) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/go/", "/buscar"] }],
    sitemap: [absoluteUrl(s, "/sitemap.xml"), absoluteUrl(s, "/news-sitemap.xml")],
    host: absoluteUrl(s, "/"),
  };
}
