"use server";

import sharp from "sharp";
import type { ActionResult } from "@/components/admin/forms";
import { requireUser } from "@/lib/auth";
import { db, newId } from "@/lib/db";
import { slugify } from "@/lib/format";
import { revalidateSite } from "@/lib/revalidate";
import type { MediaItem } from "@/lib/types";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024;

/** Procesa la imagen (WebP, máx. 2000 px) y la guarda en el almacenamiento configurado. */
export async function uploadImage(file: File, alt: string): Promise<MediaItem> {
  if (!ALLOWED.includes(file.type)) throw new Error("Formato no admitido. Usa JPG, PNG, WebP, AVIF o GIF.");
  if (file.size > MAX_BYTES) throw new Error("La imagen supera los 8 MB.");
  const input = Buffer.from(await file.arrayBuffer());
  const pipeline = sharp(input, { animated: false }).rotate().resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 82 });
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "imagen";
  const now = new Date();
  const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${base}-${newId().slice(0, 6)}.webp`;
  const url = await db().uploadFile(path, data, "image/webp");
  const item: MediaItem = {
    id: newId("med_"),
    url,
    path,
    alt: alt.trim(),
    width: info.width,
    height: info.height,
    size: data.length,
    mime: "image/webp",
    uploadedAt: now.toISOString(),
  };
  await db().put("media", item);
  return item;
}

export async function uploadMedia(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return { ok: false, message: "Selecciona una imagen." };
  try {
    await uploadImage(file, String(form.get("alt") ?? ""));
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  return { ok: true, message: "Imagen subida y optimizada." };
}

/** Subida desde otros formularios (portada de artículo, ficha de móvil…). */
export async function uploadInline(form: FormData): Promise<{ ok: true; url: string; width?: number; height?: number } | { ok: false; error: string }> {
  await requireUser();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return { ok: false, error: "Selecciona una imagen." };
  try {
    const item = await uploadImage(file, String(form.get("alt") ?? ""));
    return { ok: true, url: item.url, width: item.width, height: item.height };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateMediaAlt(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  const item = await db().get("media", String(form.get("id")));
  if (!item) return { ok: false, message: "No encontrada." };
  await db().put("media", { ...item, alt: String(form.get("alt") ?? "").slice(0, 300) });
  return { ok: true, message: "Texto alternativo guardado." };
}

export async function deleteMedia(form: FormData) {
  await requireUser();
  const item = await db().get("media", String(form.get("id")));
  if (!item) return;
  const used = (await db().list("posts")).some((p) => p.cover.src === item.url || p.body.includes(item.url));
  if (used) return;
  await db().deleteFile(item.path);
  await db().remove("media", item.id);
  revalidateSite();
}
