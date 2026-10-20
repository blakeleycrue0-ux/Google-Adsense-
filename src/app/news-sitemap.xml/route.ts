import { getPublished } from "@/lib/content";
import { absoluteUrl, getSettings } from "@/lib/settings";
import { xmlEscape } from "@/lib/xml";

export const revalidate = 300;

/** Sitemap de Google News: solo noticias de las últimas 48 horas. */
export async function GET() {
  const [s, articles] = await Promise.all([getSettings(), getPublished()]);
  const since = new Date(Date.now() - 48 * 3600_000).toISOString();
  const urls = articles
    .filter((a) => a.publishedAt! >= since)
    .slice(0, 1000)
    .map(
      (a) => `<url>
  <loc>${absoluteUrl(s, `/noticia/${a.slug}`)}</loc>
  <news:news>
    <news:publication><news:name>${xmlEscape(s.siteName)}</news:name><news:language>es</news:language></news:publication>
    <news:publication_date>${a.publishedAt}</news:publication_date>
    <news:title>${xmlEscape(a.title)}</news:title>
  </news:news>
</url>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
