import type { MetadataRoute } from "next";
import { getPublished } from "@/lib/content";
import { absoluteUrl, getSettings } from "@/lib/settings";
import { ISLANDS, SECTIONS } from "@/lib/site";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [s, articles] = await Promise.all([getSettings(), getPublished()]);
  const url = (p: string) => absoluteUrl(s, p);
  const fixed = ["/", "/ultima-hora", "/quienes-somos", "/normas-editoriales", "/contacto", "/aviso-legal", "/privacidad", "/cookies"];
  return [
    ...fixed.map((p) => ({ url: url(p), changeFrequency: p === "/" || p === "/ultima-hora" ? ("hourly" as const) : ("monthly" as const) })),
    ...ISLANDS.map((i) => ({ url: url(`/isla/${i.id}`), changeFrequency: "hourly" as const })),
    ...SECTIONS.map((x) => ({ url: url(`/seccion/${x.id}`), changeFrequency: "daily" as const })),
    ...articles.map((a) => ({
      url: url(`/noticia/${a.slug}`),
      lastModified: a.updatedAt,
      images: a.photo ? [url(a.photo.url)] : undefined,
    })),
  ];
}
