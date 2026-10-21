"use server";

import { redirect } from "next/navigation";
import { SEED_RECIPES } from "@/data/recetas-iniciales";
import { requireUser } from "@/lib/auth";
import { getRecipe, listRecipes } from "@/lib/content";
import { db, newId } from "@/lib/db";
import { slugify } from "@/lib/format";
import { findFreePhoto, needsAutoPhoto } from "@/lib/free-photos";
import { publishProblems, uniqueSlug } from "@/lib/recipes";
import { revalidateSite } from "@/lib/revalidate";
import type { Recipe } from "@/lib/types";

/**
 * Añade las recetas iniciales como PRIVADAS y sin foto. Las que ya existen
 * (mismo título) se saltan, así que se puede pulsar más de una vez sin duplicar.
 */
export async function importSeedRecipes() {
  await requireUser();
  const existing = await listRecipes();
  const titles = new Set(existing.map((r) => slugify(r.title)));
  const taken = new Set(existing.map((r) => r.slug));
  const now = new Date().toISOString();
  const toAdd: Recipe[] = [];
  for (const seed of SEED_RECIPES) {
    if (titles.has(slugify(seed.title))) continue;
    const slug = uniqueSlug(seed.title, taken);
    taken.add(slug);
    toAdd.push({ ...seed, id: newId("rec_"), slug, photo: null, status: "private", authorName: "", createdAt: now, updatedAt: now });
  }
  // En lotes en paralelo: una a una tardaría demasiado para el límite de tiempo de Netlify.
  for (let i = 0; i < toAdd.length; i += 8) {
    await Promise.all(toAdd.slice(i, i + 8).map((r) => db().put("recipes", r)));
  }
  redirect(`/admin?ver=privadas&importadas=${toAdd.length}`);
}

export type AutoPhotoResult = { ok: true; published: boolean } | { ok: false; error: string };

/**
 * Pone a una receta sin foto (o con una de Wikimedia) una foto profesional de
 * Pexels y, si se pide y ya está completa, la publica. El panel la llama receta
 * a receta para no pasarse del límite de tiempo de Netlify.
 */
export async function autoPhoto(id: string, publish: boolean): Promise<AutoPhotoResult> {
  await requireUser();
  const recipe = await getRecipe(id);
  if (!recipe) return { ok: false, error: "La receta ya no existe." };
  if (!needsAutoPhoto(recipe.photo)) return { ok: true, published: recipe.status === "published" };
  let photo;
  try {
    photo = await findFreePhoto(recipe.title);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  if (!photo) return { ok: false, error: "No he encontrado ninguna foto libre adecuada." };
  const now = new Date().toISOString();
  const updated = { ...recipe, photo, updatedAt: now };
  if (publish && recipe.status === "private" && !publishProblems(updated).length) {
    updated.status = "published";
    updated.publishedAt ??= now;
  }
  await db().put("recipes", updated);
  if (recipe.photo?.path) await db().deleteFile(recipe.photo.path).catch(() => undefined);
  revalidateSite();
  return { ok: true, published: updated.status === "published" };
}
