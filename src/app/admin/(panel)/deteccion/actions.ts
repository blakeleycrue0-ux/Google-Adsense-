"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/components/admin/forms";
import { aiEnabled, draftFromItem } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { db, newId } from "@/lib/db";
import { slugify } from "@/lib/format";
import { ingest } from "@/lib/ingest";
import type { Post } from "@/lib/types";

export async function runIngest(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  const sourceId = String(form.get("sourceId") ?? "") || undefined;
  const active = (await db().list("sources")).filter((s) => (sourceId ? s.id === sourceId : s.active));
  if (!active.length) return { ok: false, message: "No hay fuentes activas. Actívalas en «Fuentes»." };
  const r = await ingest(sourceId);
  revalidatePath("/admin", "layout");
  const errors = r.sources.filter((s) => s.error);
  return {
    ok: errors.length < r.sources.length,
    message: `${r.added} nuevas · ${r.sources.reduce((s, x) => s + x.duplicates, 0)} duplicados${errors.length ? ` · ${errors.length} fuente(s) con error` : ""}.`,
  };
}

export async function setDetectedStatus(form: FormData) {
  await requireUser();
  const item = await db().get("detected", String(form.get("id")));
  if (!item) return;
  const status = form.get("status") === "discarded" ? "discarded" : "new";
  await db().put("detected", { ...item, status });
  revalidatePath("/admin", "layout");
}

/** Crea un borrador editorial a partir de un elemento detectado (sin publicarlo). */
export async function createDraft(form: FormData) {
  const user = await requireUser();
  const item = await db().get("detected", String(form.get("id")));
  if (!item) redirect("/admin/deteccion");
  const useAi = form.get("ai") === "1" && aiEnabled();
  let body = `> Borrador creado a partir de un aviso de ${item.sourceName}. Redacta la noticia con tus propias palabras, verifica los datos en la fuente original y añade fuentes primarias cuando existan.

Entradilla: [qué ha pasado, en una o dos frases]

## Qué se sabe

[Hechos verificados]

## Por qué importa

[Contexto y consecuencias para el lector]

## Qué falta por confirmar

[Puntos pendientes]`;
  let aiNote = "";
  if (useAi) {
    try {
      body = `> ⚠️ Borrador generado con ayuda de IA a partir del titular y el extracto del feed. Verifica cada dato antes de publicar.\n\n${await draftFromItem({ title: item.title, snippet: item.snippet, source: item.sourceName, url: item.url })}`;
    } catch (e) {
      aiNote = (e as Error).message;
    }
  }
  const now = new Date().toISOString();
  const authors = await db().list("authors");
  const post: Post = {
    id: newId("post_"),
    slug: `${slugify(item.title)}-${newId().slice(0, 4)}`,
    title: item.title,
    subtitle: "",
    body,
    categoryId: item.suggestedCategoryId ?? "cat-tecnologia",
    tags: item.matchedKeywords.slice(0, 5),
    authorId: authors[0]?.id ?? "author-redaccion",
    cover: { src: "", alt: "" },
    status: "draft",
    createdAt: now,
    updatedAt: now,
    sources: [{ title: item.title, publisher: item.sourceName, url: item.url }],
    detectedItemId: item.id,
  };
  await db().put("posts", post);
  await db().put("detected", { ...item, status: "drafted", draftPostId: post.id });
  void user;
  redirect(`/admin/articulos/${post.id}${aiNote ? `?aviso=${encodeURIComponent(aiNote)}` : ""}`);
}
