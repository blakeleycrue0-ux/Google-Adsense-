"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { draftArticle, type Draft } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { storeSecret } from "@/lib/db/blobs-adapter";
import { db, newId } from "@/lib/db";
import { slugify } from "@/lib/format";
import { storePhoto } from "@/lib/images";
import { creditError } from "@/lib/photos";
import { revalidateSite } from "@/lib/revalidate";
import { ISLANDS, SECTIONS, type PhotoLicense } from "@/lib/site";
import type { Article, Photo } from "@/lib/types";

export type SaveState = { ok: boolean; message: string } | null;

const schema = z.object({
  id: z.string().optional(),
  intent: z.enum(["draft", "publish"]),
  title: z.string().trim().max(160),
  summary: z.string().trim().max(400),
  body: z.string().trim().max(40_000),
  island: z.enum(ISLANDS.map((i) => i.id) as [string, ...string[]]),
  section: z.enum(SECTIONS.map((s) => s.id) as [string, ...string[]]),
  breaking: z.literal("on").optional(),
  authorName: z.string().trim().max(80),
  sources: z.string().max(4000),
  photoUrl: z.string().max(300),
  photoPath: z.string().max(300),
  photoWidth: z.coerce.number().int().nonnegative(),
  photoHeight: z.coerce.number().int().nonnegative(),
  photoAlt: z.string().trim().max(200),
  photoLicense: z.string(),
  photoAuthor: z.string().trim().max(120),
  photoSourceUrl: z.union([z.literal(""), z.string().url("El enlace de la foto no es válido")]),
});

/** «Nombre | https://…» por línea; también acepta solo la URL. */
function parseSources(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .flatMap((l) => {
      const [a, b] = l.split("|").map((x) => x.trim());
      const url = b ?? a;
      if (!/^https?:\/\/\S+$/.test(url)) return [];
      return [{ name: b ? a : new URL(url).hostname.replace(/^www\./, ""), url }];
    })
    .slice(0, 10);
}

async function uniqueSlug(title: string, id: string) {
  const base = slugify(title) || "noticia";
  const taken = new Set((await db().list("articles")).filter((a) => a.id !== id).map((a) => a.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

export async function saveArticle(_: SaveState, form: FormData): Promise<SaveState> {
  const user = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  const publish = d.intent === "publish";

  let photo: Photo | null = null;
  if (d.photoUrl) {
    const err = creditError(d.photoLicense, d.photoAuthor);
    if (err) return { ok: false, message: err };
    if (!d.photoAlt) return { ok: false, message: "Describe la foto en una frase (lo leen Google y las personas ciegas)." };
    photo = {
      url: d.photoUrl,
      path: d.photoPath || undefined,
      width: d.photoWidth,
      height: d.photoHeight,
      alt: d.photoAlt,
      license: d.photoLicense as PhotoLicense,
      author: d.photoAuthor,
      sourceUrl: d.photoSourceUrl || undefined,
    };
  }

  if (publish) {
    if (d.title.length < 15) return { ok: false, message: "El titular es demasiado corto." };
    if (d.summary.length < 40) return { ok: false, message: "Escribe una entradilla de al menos una frase completa." };
    if (d.body.split(/\s+/).filter(Boolean).length < 120) {
      return { ok: false, message: "El cuerpo tiene menos de 120 palabras. AdSense penaliza las noticias muy cortas: añade contexto." };
    }
    if (/\[VERIFICAR/i.test(`${d.title} ${d.summary} ${d.body}`)) {
      return { ok: false, message: "Quedan marcas [VERIFICAR: …] del asistente. Comprueba esos datos y bórralas antes de publicar." };
    }
  } else if (!d.title) {
    return { ok: false, message: "Escribe al menos un titular provisional." };
  }

  const now = new Date().toISOString();
  const existing = d.id ? await db().get("articles", d.id) : null;
  const id = existing?.id ?? newId("not_");
  // La URL se fija al publicar por primera vez y ya no cambia (para no romper enlaces).
  const slug = existing?.publishedAt ? existing.slug : await uniqueSlug(d.title, id);
  const article: Article = {
    id,
    slug,
    title: d.title,
    summary: d.summary,
    body: d.body,
    island: d.island as Article["island"],
    section: d.section as Article["section"],
    photo,
    breaking: Boolean(d.breaking),
    status: publish ? "published" : "draft",
    authorName: d.authorName || user.name,
    sources: parseSources(d.sources),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    publishedAt: existing?.publishedAt ?? (publish ? now : undefined),
  };

  try {
    await db().put("articles", article);
  } catch (e) {
    return { ok: false, message: `No se ha podido guardar: ${(e as Error).message}` };
  }
  // Si se cambió de foto, se borra la anterior del almacenamiento.
  if (existing?.photo?.path && existing.photo.path !== photo?.path) await db().deleteFile(existing.photo.path).catch(() => undefined);
  revalidateSite();

  const message = publish ? (existing?.status === "published" ? "Cambios publicados." : "¡Noticia publicada!") : "Borrador guardado.";
  if (!existing) redirect(`/admin/noticia/${id}?ok=${encodeURIComponent(message)}`);
  return { ok: true, message };
}

export async function deleteArticle(form: FormData) {
  await requireUser();
  const a = await db().get("articles", String(form.get("id")));
  if (a) {
    await db().remove("articles", a.id);
    if (a.photo?.path) await db().deleteFile(a.photo.path).catch(() => undefined);
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

export type AiResult = { ok: true; draft: Draft } | { ok: true; jobId: string } | { ok: false; error: string };

/**
 * En Netlify el borrador se redacta en una función en segundo plano (sin el
 * límite de ~26 s de las peticiones) y el editor consulta el resultado con
 * `checkAiDraft`. Si esa función no está disponible, se redacta aquí mismo.
 */
export async function startAiDraft(input: { notes: string; island: string; section: string }): Promise<AiResult> {
  await requireUser();
  const notes = input.notes.trim().slice(0, 20_000);
  if (notes.length < 30) return { ok: false, error: "Pega o escribe más información (al menos un par de frases)." };
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, error: "Falta ANTHROPIC_API_KEY en las variables de entorno de Netlify." };
  const payload = { notes, island: input.island, section: input.section };

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
    return { ok: true, draft: await draftArticle(payload) };
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
