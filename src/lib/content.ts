import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { madridDayKey, normalizeText } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import type { Category, Deal, Guide, LegalPage, Post, Store } from "@/lib/types";

export function isPublished(p: Post, now = Date.now()) {
  if (p.status !== "published" && p.status !== "scheduled") return false;
  return Boolean(p.publishedAt) && new Date(p.publishedAt!).getTime() <= now;
}

const byDateDesc = (a: Post, b: Post) =>
  new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime();

export const getAllPosts = cache(() => db().list("posts"));
export const getCategories = cache(async () =>
  (await db().list("categories")).sort((a, b) => a.order - b.order),
);
export const getAuthors = cache(() => db().list("authors"));
export const getStores = cache(() => db().list("stores"));

export const getPublishedPosts = cache(async () => {
  const now = Date.now();
  return (await getAllPosts()).filter((p) => isPublished(p, now)).sort(byDateDesc);
});

export async function getPosts(opts: { categoryId?: string; tag?: string; limit?: number; exclude?: string[] } = {}) {
  let list = await getPublishedPosts();
  if (opts.categoryId) list = list.filter((p) => p.categoryId === opts.categoryId);
  if (opts.tag) {
    const t = normalizeText(opts.tag);
    list = list.filter((p) => p.tags.some((x) => normalizeText(x) === t));
  }
  if (opts.exclude?.length) list = list.filter((p) => !opts.exclude!.includes(p.id));
  return opts.limit ? list.slice(0, opts.limit) : list;
}

export async function getPostBySlug(slug: string) {
  return (await getPublishedPosts()).find((p) => p.slug === slug) ?? null;
}

export async function getCategoryMap() {
  return new Map((await getCategories()).map((c) => [c.id, c]));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
}

export async function getAuthor(id: string) {
  return (await getAuthors()).find((a) => a.id === id) ?? null;
}

export async function getAllTags() {
  const counts = new Map<string, { name: string; count: number }>();
  for (const p of await getPublishedPosts()) {
    for (const t of p.tags) {
      const key = tagSlug(t);
      const cur = counts.get(key) ?? { name: t, count: 0 };
      cur.count++;
      counts.set(key, cur);
    }
  }
  return counts;
}

export function tagSlug(tag: string) {
  return normalizeText(tag).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function getPostsByTagSlug(slug: string) {
  return (await getPublishedPosts()).filter((p) => p.tags.some((t) => tagSlug(t) === slug));
}

/** Visitas reales de los últimos `days` días por artículo (contador interno). */
export async function getViewCounts(days = 7) {
  const counters = await db().counters("views:d:");
  const keys = new Set<string>();
  for (let i = 0; i < days; i++) keys.add(madridDayKey(new Date(Date.now() - i * 86400_000)));
  const totals = new Map<string, number>();
  for (const [key, value] of Object.entries(counters)) {
    const [, , day, postId] = key.split(":");
    if (keys.has(day)) totals.set(postId, (totals.get(postId) ?? 0) + value);
  }
  return totals;
}

/**
 * «Lo más leído» ordenado por visitas reales. Si aún no hay datos suficientes,
 * `ranked` es false y la lista se completa con los artículos más recientes.
 */
export async function getMostRead(limit = 5) {
  const [posts, views] = await Promise.all([getPublishedPosts(), getViewCounts(7)]);
  const withViews = posts
    .filter((p) => (views.get(p.id) ?? 0) > 0)
    .sort((a, b) => (views.get(b.id) ?? 0) - (views.get(a.id) ?? 0));
  const ranked = withViews.length >= Math.min(3, limit);
  const rest = posts.filter((p) => !withViews.includes(p));
  return { posts: [...withViews, ...rest].slice(0, limit), ranked };
}

export async function getRelated(post: Post, limit = 3) {
  const posts = (await getPublishedPosts()).filter((p) => p.id !== post.id);
  const tags = new Set(post.tags.map(normalizeText));
  return posts
    .map((p) => ({
      p,
      score:
        (p.categoryId === post.categoryId ? 2 : 0) +
        p.tags.filter((t) => tags.has(normalizeText(t))).length * 3,
    }))
    .sort((a, b) => b.score - a.score || byDateDesc(a.p, b.p))
    .slice(0, limit)
    .map((x) => x.p);
}

// ---------- Búsqueda ----------

function scoreText(haystack: string, terms: string[], weight: number) {
  const h = normalizeText(haystack);
  return terms.reduce((s, t) => (h.includes(t) ? s + weight : s), 0);
}

export async function search(query: string) {
  const terms = normalizeText(query)
    .split(/\s+/)
    .filter((t) => t.length > 1);
  if (!terms.length) return { posts: [], phones: [] };
  const [posts, phones] = await Promise.all([getPublishedPosts(), getPhones()]);
  const rank = <T,>(items: T[], score: (x: T) => number) =>
    items
      .map((x) => ({ x, s: score(x) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.x);
  return {
    posts: rank(posts, (p) => {
      const all = normalizeText(`${p.title} ${p.subtitle} ${p.tags.join(" ")} ${p.body}`);
      if (!terms.every((t) => all.includes(t))) return 0;
      return scoreText(p.title, terms, 5) + scoreText(p.subtitle, terms, 2) + scoreText(p.tags.join(" "), terms, 3) + 1;
    }),
    phones: rank(phones, (ph) => {
      const all = normalizeText(`${ph.brand} ${ph.model} ${ph.specs.chipset}`);
      return terms.every((t) => all.includes(t)) ? 1 : 0;
    }),
  };
}

// ---------- Móviles, tiendas y ofertas ----------

export const getPhones = cache(async () =>
  (await db().list("phones")).sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model)),
);

export async function getPhoneBySlug(slug: string) {
  return (await getPhones()).find((p) => p.slug === slug) ?? null;
}

export { lowestOffer } from "@/lib/phones";

export async function getStoreMap(): Promise<Map<string, Store>> {
  return new Map((await getStores()).map((s) => [s.id, s]));
}

export const getDeals = cache(async (): Promise<Deal[]> => {
  const now = Date.now();
  return (await db().list("deals"))
    .filter((d) => d.active && (!d.expiresAt || new Date(d.expiresAt).getTime() > now))
    .sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
});

export const getGuides = cache(async (): Promise<Guide[]> =>
  (await db().list("guides")).sort((a, b) => a.order - b.order),
);

export async function getGuideBySlug(slug: string) {
  return (await getGuides()).find((g) => g.slug === slug) ?? null;
}

// ---------- Páginas legales ----------

export async function getLegalPage(slug: string): Promise<LegalPage | null> {
  const page = (await db().list("legal")).find((p) => p.slug === slug);
  if (!page) return null;
  const s = await getSettings();
  const stores = await getStores();
  const programs = stores
    .filter((st) => st.affiliate?.enabled)
    .map((st) => `- ${st.affiliate!.program}`)
    .join("\n");
  const missing = (v: string) => v || "_[Pendiente de completar en Ajustes → Datos legales]_";
  const replacements: Record<string, string> = {
    sitio: s.siteName,
    titular: missing(s.legal.ownerName),
    nif: missing(s.legal.taxId),
    direccion: missing(s.legal.address),
    registro: missing(s.legal.registry),
    email: missing(s.contactEmail),
    programas:
      programs ||
      "Actualmente no participamos en ningún programa de afiliación activo. Esta lista se actualizará cuando se aprueben las cuentas.",
  };
  return { ...page, body: page.body.replace(/\{\{(\w+)\}\}/g, (_, k: string) => replacements[k] ?? "") };
}
