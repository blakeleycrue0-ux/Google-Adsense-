import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { normalizeText } from "@/lib/format";
import { normalizeRecipe } from "@/lib/recipes";
import type { Recipe } from "@/lib/types";

const byDate = (a: Recipe, b: Recipe) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");

/** Todas las recetas (privadas y publicadas), normalizadas. Solo para el panel. */
export async function listRecipes(): Promise<Recipe[]> {
  return (await db().list("recipes")).map((r) => normalizeRecipe(r));
}

export async function getRecipe(id: string) {
  const raw = await db().get("recipes", id);
  return raw ? normalizeRecipe(raw) : null;
}

/** Recetas publicadas, de la más reciente a la más antigua. Las privadas nunca salen de aquí. */
export const getPublished = cache(async (): Promise<Recipe[]> => {
  const all = await listRecipes().catch((e) => {
    console.error("[contenido] No se pudieron leer las recetas:", e);
    return [] as Recipe[];
  });
  return all.filter((r) => r.status === "published" && r.publishedAt).sort(byDate);
});

export async function getBySlug(slug: string) {
  return (await getPublished()).find((r) => r.slug === slug) ?? null;
}

export async function getByCategory(category: string) {
  return (await getPublished()).filter((r) => r.category === category);
}

export async function getRelated(recipe: Recipe, limit = 4) {
  const rest = (await getPublished()).filter((r) => r.id !== recipe.id);
  const score = (r: Recipe) => (r.category === recipe.category ? 2 : 0) + r.tags.filter((t) => recipe.tags.includes(t)).length;
  const scored = rest.map((r) => ({ r, s: score(r) })).sort((a, b) => b.s - a.s || byDate(a.r, b.r));
  return scored.slice(0, limit).map((x) => x.r);
}

export async function search(query: string) {
  const terms = normalizeText(query).split(/\s+/).filter((t) => t.length > 1);
  if (!terms.length) return [];
  return (await getPublished()).filter((r) => {
    const text = normalizeText(`${r.title} ${r.summary} ${r.ingredients.join(" ")} ${r.tags.join(" ")}`);
    return terms.every((t) => text.includes(t));
  });
}
