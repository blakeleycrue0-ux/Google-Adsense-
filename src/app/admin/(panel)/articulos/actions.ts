"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/components/admin/forms";
import { requireUser } from "@/lib/auth";
import { db, newId } from "@/lib/db";
import { madridLocalToISO, slugify } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { imageState } from "@/lib/images/state";
import { revalidateSite } from "@/lib/revalidate";
import type { Post, SourceLink } from "@/lib/types";

const schema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(8, "El título es demasiado corto").max(160),
  subtitle: z.string().trim().max(320),
  slug: z.string().trim().max(100).optional(),
  body: z.string().max(100_000),
  categoryId: z.string().min(1, "Elige una categoría"),
  authorId: z.string().min(1),
  tags: z.string().max(500),
  coverAlt: z.string().trim().max(300).optional(),
  sources: z.string().max(5000),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(170).optional(),
  scheduledAt: z.string().optional(),
  intent: z.enum(["draft", "review", "publish", "schedule", "unpublish"]),
});

/** Fuentes: una por línea con el formato «Título | Medio | https://…». */
function parseSources(raw: string): SourceLink[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const parts = l.split("|").map((x) => x.trim());
      const url = parts.find((p) => /^https?:\/\//.test(p)) ?? "";
      const rest = parts.filter((p) => p !== url);
      return { title: rest[0] || url, publisher: rest[1] || (url ? new URL(url).hostname.replace(/^www\./, "") : ""), url };
    })
    .filter((s) => s.url);
}

export async function savePost(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = schema.safeParse({
    ...Object.fromEntries(form),
    intent: form.get("intent") ?? "draft",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  let sources: SourceLink[];
  try {
    sources = parseSources(d.sources);
  } catch {
    return { ok: false, message: "Alguna URL de las fuentes no es válida." };
  }

  const all = await db().list("posts");
  const existing = d.id ? all.find((p) => p.id === d.id) : undefined;
  const slug = slugify(d.slug || d.title);
  if (!slug) return { ok: false, message: "El slug no es válido." };
  if (all.some((p) => p.slug === slug && p.id !== existing?.id)) {
    return { ok: false, message: "Ya existe un artículo con esa URL (slug). Cámbiala." };
  }

  const now = new Date().toISOString();
  let status = existing?.status ?? "draft";
  let publishedAt = existing?.publishedAt;

  if (d.intent === "publish" || d.intent === "schedule") {
    if (!d.subtitle) return { ok: false, message: "Añade un subtítulo antes de publicar." };
    const cover = existing?.cover;
    const legacyDemo = Boolean(existing?.isDemo && cover?.illustrative);
    if (!cover?.src || (imageState(cover) !== "approved" && !legacyDemo)) {
      return { ok: false, message: "Aprueba una imagen principal en el gestor de imágenes antes de publicar." };
    }
    if ((d.coverAlt ?? cover.alt).trim().length < 8) return { ok: false, message: "Añade un texto alternativo descriptivo a la imagen principal." };
    if (d.body.trim().length < 300) return { ok: false, message: "El cuerpo es demasiado corto para publicarse." };
  }
  switch (d.intent) {
    case "draft":
      status = existing?.status === "published" ? "published" : "draft";
      break;
    case "review":
      status = "review";
      break;
    case "publish":
      status = "published";
      if (!publishedAt || existing?.status !== "published") publishedAt = now;
      break;
    case "schedule": {
      const iso = d.scheduledAt ? madridLocalToISO(d.scheduledAt) : null;
      if (!iso || new Date(iso).getTime() <= Date.now()) return { ok: false, message: "Indica una fecha de programación futura." };
      status = "scheduled";
      publishedAt = iso;
      break;
    }
    case "unpublish":
      status = "draft";
      break;
  }

  const post: Post = {
    ...(existing ?? { createdAt: now, isDemo: false }),
    id: existing?.id ?? newId("post_"),
    slug,
    title: d.title,
    subtitle: d.subtitle,
    body: d.body,
    categoryId: d.categoryId,
    authorId: d.authorId,
    tags: d.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 12),
    // La imagen se elige en el gestor de imágenes; aquí solo se edita su texto alternativo.
    cover: existing ? { ...existing.cover, alt: d.coverAlt ?? existing.cover.alt } : { src: "", alt: d.coverAlt ?? "" },
    sources,
    status,
    publishedAt,
    updatedAt: now,
    isBreaking: form.get("isBreaking") === "on",
    isFeatured: form.get("isFeatured") === "on",
    seoTitle: d.seoTitle || undefined,
    seoDescription: d.seoDescription || undefined,
  } as Post;

  try {
    await db().put("posts", post);
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  revalidateSite();
  const messages: Record<string, string> = {
    draft: "Cambios guardados.",
    review: "Enviado a revisión.",
    publish: "Artículo publicado.",
    schedule: "Publicación programada.",
    unpublish: "Artículo retirado (ahora es un borrador).",
  };
  return { ok: true, message: messages[d.intent], redirectTo: existing ? undefined : `/admin/articulos/${post.id}` };
}

export async function deletePost(form: FormData) {
  await requireUser();
  const id = String(form.get("id"));
  await db().remove("posts", id);
  revalidateSite();
  redirect("/admin/articulos");
}

export async function previewMarkdown(md: string) {
  await requireUser();
  return renderMarkdown(md.slice(0, 100_000));
}
