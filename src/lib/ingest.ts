import "server-only";
import { XMLParser } from "fast-xml-parser";
import { db, newId } from "@/lib/db";
import { normalizeText } from "@/lib/format";
import type { DetectedItem, NewsSource } from "@/lib/types";

/**
 * Detección de noticias a partir de fuentes RSS/Atom autorizadas.
 * Solo guarda titular, enlace, fecha y el extracto que la propia fuente
 * publica en su feed. Nada se publica automáticamente: cada elemento queda
 * en la cola de revisión del panel.
 */

const TRACKING = /^(utm_|fbclid|gclid|mc_|ref$|ref_src|cmpid|ncid|taid)/i;

export function normalizeUrl(raw: string) {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
    [...u.searchParams.keys()].forEach((k) => TRACKING.test(k) && u.searchParams.delete(k));
    u.pathname = u.pathname.replace(/\/+$/, "") || "/";
    return `${u.hostname}${u.pathname}${u.search}`;
  } catch {
    return raw.trim().toLowerCase();
  }
}

const STOP = new Set(
  "el la los las un una unos unas de del al a en y o u que por para con sin se su sus es son ya como mas más este esta estos estas lo le les ha han the a an of to in on for and or is are with from at by its it as new nuevo nueva".split(" "),
);

export function tokens(title: string) {
  return new Set(
    normalizeText(title)
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

export function similarity(a: string, b: string) {
  const A = tokens(a);
  const B = tokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((t) => B.has(t) && inter++);
  return inter / (A.size + B.size - inter);
}

/** Palabras clave por categoría (editables en el código; ponderadas). */
const RULES: Record<string, [string, number][]> = {
  "cat-apple": [["apple", 3], ["iphone", 3], ["ipad", 3], ["ios", 2], ["macos", 3], ["mac", 2], ["airpods", 3], ["vision pro", 3], ["watchos", 3]],
  "cat-android": [["android", 3], ["samsung", 2], ["galaxy", 3], ["pixel", 3], ["xiaomi", 2], ["oneplus", 2], ["one ui", 3], ["motorola", 2]],
  "cat-ia": [["inteligencia artificial", 3], [" ia ", 2], [" ai ", 2], ["openai", 3], ["chatgpt", 3], ["gemini", 3], ["claude", 3], ["anthropic", 3], ["llm", 3], ["modelo de lenguaje", 3], ["copilot", 2], ["machine learning", 2]],
  "cat-videojuegos": [["videojuego", 3], ["playstation", 3], ["ps5", 3], ["xbox", 3], ["nintendo", 3], ["switch 2", 3], ["steam", 2], ["gaming", 2], ["game", 1]],
  "cat-ordenadores": [["portatil", 3], ["laptop", 3], ["procesador", 2], ["intel", 2], ["amd", 2], ["nvidia", 2], ["windows", 2], ["gpu", 2], ["cpu", 2], ["chromebook", 3]],
  "cat-moviles": [["movil", 3], ["smartphone", 3], ["telefono", 2], ["phone", 2], ["5g", 1], ["bateria", 1]],
};

export function classify(title: string, snippet: string, fallback?: string) {
  const text = ` ${normalizeText(`${title} ${title} ${snippet}`)} `;
  let best: { id?: string; score: number; matched: string[] } = { id: fallback, score: 0, matched: [] };
  for (const [cat, rules] of Object.entries(RULES)) {
    const matched = rules.filter(([kw]) => text.includes(normalizeText(kw)));
    const score = matched.reduce((s, [, w]) => s + w, 0);
    if (score > best.score) best = { id: cat, score, matched: matched.map(([k]) => k.trim()) };
  }
  return { categoryId: best.id ?? "cat-tecnologia", matched: best.matched };
}

type FeedItem = { title: string; url: string; snippet: string; publishedAt?: string };

const textOf = (v: unknown): string => {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object" && "#text" in (v as object)) return String((v as { "#text": unknown })["#text"]);
  return "";
};
const stripHtml = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
const asArray = <T,>(v: T | T[] | undefined): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

export function parseFeed(xml: string): FeedItem[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@", processEntities: true, htmlEntities: true });
  const doc = parser.parse(xml);
  const toIso = (d: string) => {
    const t = new Date(d).getTime();
    return Number.isFinite(t) ? new Date(t).toISOString() : undefined;
  };
  if (doc.rss?.channel) {
    return asArray(doc.rss.channel.item).map((it: Record<string, unknown>) => ({
      title: stripHtml(textOf(it.title)),
      url: textOf(it.link) || textOf(it.guid),
      snippet: stripHtml(textOf(it.description)).slice(0, 400),
      publishedAt: toIso(textOf(it.pubDate) || textOf(it["dc:date"])),
    }));
  }
  if (doc.feed) {
    return asArray(doc.feed.entry).map((e: Record<string, unknown>) => {
      const links = asArray(e.link as Record<string, string> | Record<string, string>[]);
      const href = links.find((l) => !l["@rel"] || l["@rel"] === "alternate")?.["@href"] ?? links[0]?.["@href"] ?? "";
      return {
        title: stripHtml(textOf(e.title)),
        url: href,
        snippet: stripHtml(textOf(e.summary) || textOf(e.content)).slice(0, 400),
        publishedAt: toIso(textOf(e.published) || textOf(e.updated)),
      };
    });
  }
  throw new Error("El documento no es un feed RSS o Atom reconocible.");
}

async function fetchFeed(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "VoltioNewsBot/1.0 (+revisión editorial)", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export interface IngestReport {
  sources: { id: string; name: string; added: number; duplicates: number; error?: string }[];
  added: number;
}

export async function ingest(onlySourceId?: string): Promise<IngestReport> {
  const sources = (await db().list("sources")).filter((s) => (onlySourceId ? s.id === onlySourceId : s.active));
  const existing = await db().list("detected");
  const posts = await db().list("posts");
  const knownUrls = new Set(existing.map((d) => d.normalizedUrl));
  const recentWindow = Date.now() - 4 * 86400_000;
  const recent = existing.filter((d) => new Date(d.detectedAt).getTime() > recentWindow && !d.duplicateOf);
  const report: IngestReport = { sources: [], added: 0 };

  for (const source of sources) {
    const row = { id: source.id, name: source.name, added: 0, duplicates: 0 } as IngestReport["sources"][number];
    let updated: NewsSource = { ...source, lastFetchedAt: new Date().toISOString() };
    try {
      const items = parseFeed(await fetchFeed(source.feedUrl)).filter((i) => i.title && /^https?:\/\//.test(i.url)).slice(0, 50);
      for (const it of items) {
        const normalizedUrl = normalizeUrl(it.url);
        if (knownUrls.has(normalizedUrl)) continue; // ya detectado
        knownUrls.add(normalizedUrl);
        // Duplicado probable: misma historia contada por otra fuente o ya publicada.
        let dup: { id: string; score: number } | null = null;
        for (const r of recent) {
          const score = similarity(it.title, r.title);
          if (score >= 0.5 && (!dup || score > dup.score)) dup = { id: r.id, score };
        }
        const publishedDup = posts.find((p) => similarity(it.title, p.title) >= 0.6);
        const { categoryId, matched } = classify(it.title, it.snippet, source.defaultCategoryId);
        const item: DetectedItem = {
          id: newId("det_"),
          sourceId: source.id,
          sourceName: source.name,
          title: it.title.slice(0, 300),
          url: it.url,
          normalizedUrl,
          snippet: it.snippet,
          publishedAt: it.publishedAt,
          detectedAt: new Date().toISOString(),
          suggestedCategoryId: categoryId,
          matchedKeywords: matched,
          duplicateOf: dup?.id ?? (publishedDup ? `post:${publishedDup.id}` : undefined),
          similarity: dup?.score,
          status: "new",
        };
        await db().put("detected", item);
        if (item.duplicateOf) row.duplicates++;
        else {
          row.added++;
          recent.push(item);
        }
      }
      updated = { ...updated, lastError: undefined, lastItemCount: items.length };
    } catch (e) {
      row.error = (e as Error).message;
      updated = { ...updated, lastError: row.error };
    }
    await db().put("sources", updated);
    report.sources.push(row);
    report.added += row.added;
  }
  return report;
}
