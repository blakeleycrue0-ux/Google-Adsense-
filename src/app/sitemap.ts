import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getAllTags, getCategories, getGuides, getPhones, getPublishedPosts } from "@/lib/content";
import { absoluteUrl, getSettings } from "@/lib/settings";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [s, posts, cats, phones, guides, tags, legal] = await Promise.all([
    getSettings(),
    getPublishedPosts(),
    getCategories(),
    getPhones(),
    getGuides(),
    getAllTags(),
    db().list("legal"),
  ]);
  const u = (p: string) => absoluteUrl(s, p);
  const latest = posts[0]?.updatedAt ?? new Date().toISOString();
  return [
    { url: u("/"), lastModified: latest, changeFrequency: "hourly", priority: 1 },
    { url: u("/ultima-hora"), lastModified: latest, changeFrequency: "hourly", priority: 0.9 },
    { url: u("/tecnologia"), lastModified: latest, changeFrequency: "hourly", priority: 0.8 },
    { url: u("/moviles"), changeFrequency: "daily", priority: 0.8 },
    { url: u("/comparativas"), changeFrequency: "weekly", priority: 0.7 },
    { url: u("/comparar"), changeFrequency: "weekly", priority: 0.5 },
    { url: u("/ofertas"), changeFrequency: "daily", priority: 0.7 },
    { url: u("/contacto"), changeFrequency: "yearly", priority: 0.3 },
    { url: u("/creditos-imagenes"), changeFrequency: "weekly", priority: 0.2 },
    ...cats.map((c) => ({ url: u(`/categoria/${c.slug}`), changeFrequency: "daily" as const, priority: 0.7 })),
    ...posts.map((p) => ({
      url: u(`/noticias/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: [u(p.cover.src)],
    })),
    ...phones.map((p) => ({ url: u(`/moviles/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...guides.map((g) => ({ url: u(`/comparativas/${g.slug}`), lastModified: g.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...[...tags.keys()].map((t) => ({ url: u(`/etiqueta/${t}`), changeFrequency: "weekly" as const, priority: 0.4 })),
    ...legal.map((l) => ({ url: u(`/legal/${l.slug}`), lastModified: l.updatedAt, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
