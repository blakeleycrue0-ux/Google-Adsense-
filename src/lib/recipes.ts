import { slugify } from "@/lib/format";
import { isCategory } from "@/lib/site";
import type { Recipe } from "@/lib/types";

/** Lógica pura de recetas (sin acceso a datos). Se prueba en tests/. */

export const recipePath = (r: Pick<Recipe, "slug">) => `/receta/${r.slug}`;

export const totalMinutes = (r: Pick<Recipe, "prepMinutes" | "cookMinutes">) => (r.prepMinutes || 0) + (r.cookMinutes || 0);

/** «45 min», «1 h», «1 h 20 min». */
export function formatMinutes(min: number) {
  if (!min) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
}

/** Duración ISO 8601 para los datos estructurados (PT1H20M). */
export function isoDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `PT${h ? `${h}H` : ""}${m || !h ? `${m}M` : ""}`;
}

/** Líneas no vacías, sin viñetas ni numeración que pegue la gente («- », «1.»). */
export function parseLines(text: string, max = 80) {
  return text
    .split("\n")
    .map((l) => l.trim().replace(/^([-*•·]|\d+[.)])\s+/, ""))
    .filter(Boolean)
    .slice(0, max);
}

/** Agrupa los ingredientes por los subtítulos «# …». */
export function groupIngredients(lines: string[]) {
  const groups: { title: string; items: string[] }[] = [];
  for (const line of lines) {
    if (line.startsWith("#")) groups.push({ title: line.replace(/^#+\s*/, ""), items: [] });
    else {
      if (!groups.length) groups.push({ title: "", items: [] });
      groups[groups.length - 1].items.push(line);
    }
  }
  return groups.filter((g) => g.items.length || g.title);
}

export function parseTags(text: string) {
  const seen = new Set<string>();
  return text
    .split(",")
    .map((t) => t.trim().replace(/\s+/g, " ").toLowerCase())
    .filter((t) => t.length > 1 && t.length <= 30 && !seen.has(t) && seen.add(t))
    .slice(0, 8);
}

export function uniqueSlug(wanted: string, taken: Set<string>) {
  const base = slugify(wanted) || "receta";
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

/** Lee una receta guardada rellenando campos que falten (versiones anteriores). */
export function normalizeRecipe(raw: Partial<Recipe> & { id: string }): Recipe {
  return {
    id: raw.id,
    slug: raw.slug || raw.id,
    title: raw.title ?? "",
    summary: raw.summary ?? "",
    category: raw.category && isCategory(raw.category) ? raw.category : "entrantes",
    ingredients: raw.ingredients ?? [],
    steps: raw.steps ?? [],
    tips: raw.tips ?? "",
    prepMinutes: raw.prepMinutes ?? 0,
    cookMinutes: raw.cookMinutes ?? 0,
    servings: raw.servings ?? "",
    difficulty: raw.difficulty ?? "facil",
    tags: raw.tags ?? [],
    photo: raw.photo ?? null,
    status: raw.status === "published" ? "published" : "private",
    authorName: raw.authorName ?? "",
    createdAt: raw.createdAt ?? new Date(0).toISOString(),
    updatedAt: raw.updatedAt ?? raw.createdAt ?? new Date(0).toISOString(),
    publishedAt: raw.publishedAt,
  };
}

/** Requisitos mínimos para publicar (Google y AdSense penalizan las páginas pobres). */
export function publishProblems(r: Pick<Recipe, "title" | "summary" | "ingredients" | "steps" | "photo">) {
  const problems: string[] = [];
  if (r.title.trim().length < 5) problems.push("Escribe un título.");
  if (r.summary.trim().length < 40) problems.push("Escribe una presentación de al menos una frase completa (40 caracteres).");
  if (r.ingredients.filter((l) => !l.startsWith("#")).length < 2) problems.push("Añade los ingredientes (uno por línea).");
  if (r.steps.length < 2) problems.push("Añade al menos dos pasos de elaboración.");
  if (!r.photo) problems.push("Sube una foto del plato: las recetas sin foto casi no reciben visitas.");
  return problems;
}
