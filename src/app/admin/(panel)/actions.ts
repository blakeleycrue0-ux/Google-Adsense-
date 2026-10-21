"use server";

import { redirect } from "next/navigation";
import { SEED_RECIPES } from "@/data/recetas-iniciales";
import { requireUser } from "@/lib/auth";
import { listRecipes } from "@/lib/content";
import { db, newId } from "@/lib/db";
import { slugify } from "@/lib/format";
import { uniqueSlug } from "@/lib/recipes";
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
