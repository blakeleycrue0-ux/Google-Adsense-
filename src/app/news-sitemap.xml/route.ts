import { getPublishedPosts } from "@/lib/content";
import { absoluteUrl, getSettings } from "@/lib/settings";
import { xmlEscape } from "@/lib/xml";

export const revalidate = 300;

/** Sitemap de Google News: solo artículos de las últimas 48 horas. */
export async function GET() {
  const [s, posts] = await Promise.all([getSettings(), getPublishedPosts()]);
  const since = Date.now() - 48 * 3600_000;
  const recent = posts.filter((p) => new Date(p.publishedAt!).getTime() >= since && !p.isDemo).slice(0, 1000);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${recent
  .map(
    (p) => `<url>
  <loc>${absoluteUrl(s, `/noticias/${p.slug}`)}</loc>
  <news:news>
    <news:publication><news:name>${xmlEscape(s.siteName)}</news:name><news:language>es</news:language></news:publication>
    <news:publication_date>${p.publishedAt}</news:publication_date>
    <news:title>${xmlEscape(p.title)}</news:title>
  </news:news>
</url>`,
  )
  .join("\n")}
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
