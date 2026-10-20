import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { normalizeText } from "@/lib/format";
import type { Article } from "@/lib/types";

const byDate = (a: Article, b: Article) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");

/** Noticias publicadas, de la más reciente a la más antigua. */
export const getPublished = cache(async (): Promise<Article[]> => {
  const all = await db()
    .list("articles")
    .catch((e) => {
      console.error("[contenido] No se pudieron leer las noticias:", e);
      return [] as Article[];
    });
  return all.filter((a) => a.status === "published" && a.publishedAt).sort(byDate);
});

export async function getBySlug(slug: string) {
  return (await getPublished()).find((a) => a.slug === slug) ?? null;
}

/** Última hora: marcadas como tal en las últimas 24 horas. */
export async function getBreaking() {
  const since = new Date(Date.now() - 86400_000).toISOString();
  return (await getPublished()).filter((a) => a.breaking && a.publishedAt! >= since);
}

export async function getRelated(article: Article, limit = 4) {
  const rest = (await getPublished()).filter((a) => a.id !== article.id);
  const same = rest.filter((a) => a.island === article.island || a.section === article.section);
  return [...same, ...rest.filter((a) => !same.includes(a))].slice(0, limit);
}

export async function search(query: string) {
  const terms = normalizeText(query).split(/\s+/).filter((t) => t.length > 1);
  if (!terms.length) return [];
  return (await getPublished()).filter((a) => {
    const text = normalizeText(`${a.title} ${a.summary} ${a.body}`);
    return terms.every((t) => text.includes(t));
  });
}
