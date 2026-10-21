"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { draftRecipe } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { getRecipe, listRecipes } from "@/lib/content";
import { storeSecret } from "@/lib/db/blobs-adapter";
import { db, newId } from "@/lib/db";
import { findFreePhoto } from "@/lib/free-photos";
import { storePhoto } from "@/lib/images";
import { creditError } from "@/lib/photos";
import { parseLines, parseTags, publishProblems, uniqueSlug } from "@/lib/recipes";
import { revalidateSite } from "@/lib/revalidate";
import { CATEGORIES, DIFFICULTIES, type PhotoLicense } from "@/lib/site";
import type { Photo, Recipe, RecipeDraft } from "@/lib/types";

export type SaveState = { ok: boolean; message: string } | null;

const minutes = z.coerce.number().int().min(0).max(10_000).catch(0);

const schema = z.object({
  id: z.string().optional(),
  intent: z.enum(["private", "publish"]),
  title: z.string().trim().max(140),
  summary: z.string().trim().max(500),
  category: z.enum(CATEGORIES.map((c) => c.id) as [string, ...string[]]),
  difficulty: z.enum(DIFFICULTIES.map((d) => d.id) as [string, ...string[]]),
  ingredients: z.string().max(10_000),
  steps: z.string().max(30_000),
  tips: z.string().trim().max(10_000),
  prepMinutes: minutes,
  cookMinutes: minutes,
  servings: z.string().trim().max(60),
  tags: z.string().max(400),
  authorName: z.string().trim().max(80),
  photoUrl: z.string().max(400),
  photoPath: z.string().max(300),
  photoWidth: z.coerce.number().int().nonnegative(),
  photoHeight: z.coerce.number().int().nonnegative(),
  photoAlt: z.string().trim().max(200),
  photoLicense: z.string(),
  photoAuthor: z.string().trim().max(120),
  photoSourceUrl: z.union([z.literal(""), z.string().url("El enlace de la foto no es válido")]),
});

export async function saveRecipe(_: SaveState, form: FormData): Promise<SaveState> {
  await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  const publish = d.intent === "publish";

  let photo: Photo | null = null;
  if (d.photoUrl) {
    const err = creditError(d.photoLicense, d.photoAuthor);
    if (err) return { ok: false, message: err };
    photo = {
      url: d.photoUrl,
      path: d.photoPath || undefined,
      width: d.photoWidth,
      height: d.photoHeight,
      // Sin descripción, el título describe la foto (lo leen Google y los lectores de pantalla).
      alt: d.photoAlt || d.title,
      license: d.photoLicense as PhotoLicense,
      author: d.photoAuthor,
      sourceUrl: d.photoSourceUrl || undefined,
    };
  }

  const content = {
    title: d.title,
    summary: d.summary,
    category: d.category as Recipe["category"],
    difficulty: d.difficulty as Recipe["difficulty"],
    ingredients: parseLines(d.ingredients, 120),
    steps: parseLines(d.steps, 60),
    tips: d.tips,
    prepMinutes: d.prepMinutes,
    cookMinutes: d.cookMinutes,
    servings: d.servings,
    tags: parseTags(d.tags),
    photo,
  };

  if (!d.title) return { ok: false, message: "Escribe al menos el nombre de la receta." };
  if (publish) {
    const problems = publishProblems(content);
    if (problems.length) return { ok: false, message: `Para publicar falta: ${problems.join(" ")}` };
    if (/\[REVISAR/i.test(JSON.stringify(content))) {
      return { ok: false, message: "Quedan marcas [REVISAR: …] del asistente. Complétalas antes de publicar." };
    }
  }

  const now = new Date().toISOString();
  const existing = d.id ? await getRecipe(d.id) : null;
  const id = existing?.id ?? newId("rec_");
  // La URL se fija al publicar por primera vez y ya no cambia (para no romper enlaces compartidos).
  const slug = existing?.publishedAt ? existing.slug : uniqueSlug(d.title, new Set((await listRecipes()).filter((r) => r.id !== id).map((r) => r.slug)));
  const recipe: Recipe = {
    id,
    slug,
    ...content,
    status: publish ? "published" : "private",
    authorName: d.authorName,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    publishedAt: existing?.publishedAt ?? (publish ? now : undefined),
  };

  try {
    await db().put("recipes", recipe);
  } catch (e) {
    return { ok: false, message: `No se ha podido guardar: ${(e as Error).message}` };
  }
  // Si se cambió de foto, se borra la anterior del almacenamiento.
  if (existing?.photo?.path && existing.photo.path !== photo?.path) await db().deleteFile(existing.photo.path).catch(() => undefined);
  revalidateSite();

  const message = publish ? (existing?.status === "published" ? "Cambios publicados." : "¡Receta publicada!") : "Guardada como privada (solo la ves tú).";
  if (!existing) redirect(`/admin/receta/${id}?ok=${encodeURIComponent(message)}`);
  return { ok: true, message };
}

export async function deleteRecipe(form: FormData) {
  await requireUser();
  const r = await getRecipe(String(form.get("id")));
  if (r) {
    await db().remove("recipes", r.id);
    if (r.photo?.path) await db().deleteFile(r.photo.path).catch(() => undefined);
    revalidateSite();
  }
  redirect("/admin?borrada=1");
}

export type UploadResult = { ok: true; url: string; path: string; width: number; height: number } | { ok: false; error: string };

export async function uploadPhoto(form: FormData): Promise<UploadResult> {
  await requireUser();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return { ok: false, error: "Selecciona una foto." };
  try {
    return { ok: true, ...(await storePhoto(file)) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export type FreePhotoResult = { ok: true; photo: Photo } | { ok: false; error: string };

/** Busca una foto libre para el plato; `exclude` son las ya propuestas, para dar otra distinta. */
export async function suggestFreePhoto(title: string, exclude: string[]): Promise<FreePhotoResult> {
  await requireUser();
  if (title.trim().length < 3) return { ok: false, error: "Escribe primero el nombre de la receta." };
  try {
    const photo = await findFreePhoto(title.trim().slice(0, 140), exclude.slice(0, 50));
    return photo ? { ok: true, photo } : { ok: false, error: "No he encontrado (más) fotos libres para este plato. Sube una tuya." };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export type AiResult = { ok: true; draft: RecipeDraft } | { ok: true; jobId: string } | { ok: false; error: string };

/**
 * En Netlify la receta se ordena en una función en segundo plano (sin el
 * límite de ~26 s de las peticiones) y el editor consulta el resultado con
 * `checkAiDraft`. Si esa función no está disponible, se hace aquí mismo.
 */
export async function startAiDraft(input: { notes: string; category: string }): Promise<AiResult> {
  await requireUser();
  const notes = input.notes.trim().slice(0, 20_000);
  if (notes.length < 30) return { ok: false, error: "Escribe un poco más: ingredientes y cómo se hace, aunque sea en desorden." };
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, error: "Falta ANTHROPIC_API_KEY en las variables de entorno de Netlify." };
  const payload = { notes, category: input.category };

  const base = process.env.URL;
  if (base && db().kind !== "file") {
    const id = newId("ai_");
    const res = await fetch(`${base.replace(/\/$/, "")}/.netlify/functions/ai-draft-background`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${storeSecret()}` },
      body: JSON.stringify({ id, ...payload }),
      cache: "no-store",
    }).catch(() => null);
    if (res?.status === 202) return { ok: true, jobId: id };
  }
  try {
    return { ok: true, draft: await draftRecipe(payload) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function checkAiDraft(jobId: string): Promise<AiResult | { ok: true; pending: true }> {
  await requireUser();
  if (!/^ai_[a-z0-9]{16}$/.test(jobId)) return { ok: false, error: "Trabajo no válido." };
  const job = await db().get("jobs", jobId);
  if (!job) return { ok: true, pending: true };
  await db()
    .remove("jobs", jobId)
    .catch(() => undefined);
  return job.status === "done" && job.draft ? { ok: true, draft: job.draft } : { ok: false, error: job.error ?? "El asistente ha fallado." };
}
