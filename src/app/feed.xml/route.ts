import { getPublished } from "@/lib/content";
import { absoluteUrl, getSettings } from "@/lib/settings";
import { sectionName } from "@/lib/site";
import { xmlEscape } from "@/lib/xml";

export const revalidate = 300;

export async function GET() {
  const [s, articles] = await Promise.all([getSettings(), getPublished()]);
  const items = articles
    .slice(0, 50)
    .map((a) => {
      const url = absoluteUrl(s, `/noticia/${a.slug}`);
      return `<item>
  <title>${xmlEscape(a.title)}</title>
  <link>${url}</link>
  <guid isPermaLink="true">${url}</guid>
  <pubDate>${new Date(a.publishedAt!).toUTCString()}</pubDate>
  <category>${xmlEscape(sectionName(a.section))}</category>
  <description>${xmlEscape(a.summary)}</description>${a.photo ? `\n  <enclosure url="${xmlEscape(absoluteUrl(s, a.photo.url))}" type="image/webp" length="0"/>` : ""}
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
