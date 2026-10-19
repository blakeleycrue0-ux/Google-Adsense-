import { getCategoryMap, getPublishedPosts } from "@/lib/content";
import { absoluteUrl, getSettings } from "@/lib/settings";
import { xmlEscape } from "@/lib/xml";

export const revalidate = 300;

export async function GET() {
  const [s, posts, cats] = await Promise.all([getSettings(), getPublishedPosts(), getCategoryMap()]);
  const items = posts
    .slice(0, 50)
    .map((p) => {
      const url = absoluteUrl(s, `/noticias/${p.slug}`);
      return `<item>
  <title>${xmlEscape(p.title)}</title>
  <link>${url}</link>
  <guid isPermaLink="true">${url}</guid>
  <pubDate>${new Date(p.publishedAt!).toUTCString()}</pubDate>
  <category>${xmlEscape(cats.get(p.categoryId)?.name ?? "")}</category>
  <description>${xmlEscape(p.subtitle)}</description>
  <enclosure url="${xmlEscape(absoluteUrl(s, p.cover.src))}" type="image/webp" length="0"/>
</item>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${xmlEscape(s.siteName)}</title>
  <link>${absoluteUrl(s, "/")}</link>
  <description>${xmlEscape(s.tagline)}</description>
  <language>es-ES</language>
  <atom:link href="${absoluteUrl(s, "/feed.xml")}" rel="self" type="application/rss+xml"/>
${items}
</channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
