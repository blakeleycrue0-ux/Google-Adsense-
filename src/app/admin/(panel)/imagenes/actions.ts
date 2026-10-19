"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/components/admin/forms";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { applyImage, importCandidate, importFromUrl, ImportError, storeImage } from "@/lib/images/import";
import { attributionText, isUsable, LICENSES } from "@/lib/images/licenses";
import { providerInfo, ProviderError, searchProvider } from "@/lib/images/providers";
import { autoPropose, getSearch, searchImages } from "@/lib/images/search";
import { revalidateSite } from "@/lib/revalidate";
import type { ImageMeta, ImageProviderId, ImageTargetType, LicenseCode } from "@/lib/types";

const target = z.object({ type: z.enum(["post", "phone"]), id: z.string().min(1) });
const kindOf = (t: ImageTargetType) => (t === "phone" ? "phone" : "cover") as "phone" | "cover";
const focal = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  return Number.isFinite(n) && v !== "" && v !== null ? Math.max(0, Math.min(100, n)) : undefined;
};

function done(type: ImageTargetType, id: string, message: string): ActionResult {
  revalidateSite();
  revalidatePath(`/admin/imagenes/${type}/${id}`);
  return { ok: true, message };
}

function fail(e: unknown): ActionResult {
  if (e instanceof ImportError || e instanceof ProviderError) return { ok: false, message: e.message };
  console.error(e);
  return { ok: false, message: "No se ha podido completar la operación." };
}

export async function searchAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  const t = z.object({ type: z.enum(["post", "phone", "detected"]), id: z.string() }).parse(Object.fromEntries(form));
  const providers = form.getAll("providers").map(String) as ImageProviderId[];
  const s = await searchImages(t.type, t.id, { query: String(form.get("query") ?? ""), providers, origin: "manual" });
  revalidatePath(`/admin/imagenes/${t.type}/${t.id}`);
  if (!s) return { ok: false, message: "Contenido no encontrado." };
  const usable = s.candidates.filter((c) => c.usable && c.matched).length;
  const errs = s.errors.length ? ` · ${s.errors.length} proveedor(es) con error` : "";
  return { ok: usable > 0 || s.errors.length === 0, message: `${s.candidates.length} resultados, ${usable} utilizables${errs}.` };
}

/** Selecciona una candidata: comprueba licencia y coincidencia, la importa y la asigna. */
export async function selectCandidate(_: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const t = target.parse(Object.fromEntries(form));
    const alt = String(form.get("alt") ?? "").trim();
    if (alt.length < 8) return { ok: false, message: "Escribe un texto alternativo descriptivo (mínimo 8 caracteres)." };
    const search = await getSearch(t.type, t.id);
    const c = search?.candidates.find((x) => x.key === form.get("key"));
    if (!c) return { ok: false, message: "La búsqueda ha caducado. Vuelve a buscar." };
    if (!c.matched && form.get("confirm") !== "on") {
      return { ok: false, message: "Esta imagen no coincide claramente con el contenido. Marca la confirmación si has comprobado que es correcta." };
    }
    const ref = await importCandidate(c, kindOf(t.type), alt, user.email);
    ref.meta = { ...ref.meta!, focalX: focal(form.get("focalX")), focalY: focal(form.get("focalY")) };
    await applyImage(t.type, t.id, ref);
    return done(t.type, t.id, "Imagen aprobada y asignada.");
  } catch (e) {
    return fail(e);
  }
}

const LICENSE_FOR_UPLOAD: LicenseCode[] = ["own", "press", "retailer", "cc0", "pdm", "cc-by", "cc-by-sa"];

function declaredMeta(form: FormData, user: string, provider: ImageProviderId): ImageMeta | { ok: false; message: string } {
  const license = String(form.get("license") ?? "own") as LicenseCode;
  if (!LICENSE_FOR_UPLOAD.includes(license) || !isUsable(license)) return { ok: false, message: "Licencia no admitida." };
  const permissionNote = String(form.get("permissionNote") ?? "").trim();
  if ((license === "press" || license === "retailer") && !permissionNote) {
    return { ok: false, message: "Indica el permiso o las condiciones que autorizan el uso de la imagen." };
  }
  const author = String(form.get("author") ?? "").trim();
  if (LICENSES[license].attribution && license !== "press" && !author) return { ok: false, message: "Esta licencia exige indicar la autoría." };
  return {
    status: "approved",
    provider: license === "press" ? "press" : license === "retailer" ? "retailer" : provider,
    license,
    licenseName: LICENSES[license].name,
    licenseUrl: LICENSES[license].url,
    author: author || undefined,
    sourceUrl: String(form.get("sourceUrl") ?? "").trim() || undefined,
    permissionNote: permissionNote || undefined,
    attributionRequired: LICENSES[license].attribution,
    approvedAt: new Date().toISOString(),
    approvedBy: user,
  };
}

export async function uploadForTarget(_: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const t = target.parse(Object.fromEntries(form));
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) return { ok: false, message: "Selecciona una imagen." };
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) return { ok: false, message: "Formato no admitido (JPG, PNG, WebP o AVIF)." };
    if (file.size > 25 * 1024 * 1024) return { ok: false, message: "La imagen supera los 25 MB." };
    const alt = String(form.get("alt") ?? "").trim();
    if (alt.length < 8) return { ok: false, message: "Escribe un texto alternativo descriptivo." };
    const meta = declaredMeta(form, user.email, "upload");
    if ("ok" in meta) return meta;
    meta.focalX = focal(form.get("focalX"));
    meta.focalY = focal(form.get("focalY"));
    const item = await storeImage(Buffer.from(await file.arrayBuffer()), file.name.replace(/\.[^.]+$/, ""), kindOf(t.type), meta, alt);
    await applyImage(t.type, t.id, { src: item.url, alt, width: item.width, height: item.height, credit: attributionText(meta), meta });
    return done(t.type, t.id, "Imagen subida, optimizada y asignada.");
  } catch (e) {
    return fail(e);
  }
}

export async function importUrlForTarget(_: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const t = target.parse(Object.fromEntries(form));
    const alt = String(form.get("alt") ?? "").trim();
    if (alt.length < 8) return { ok: false, message: "Escribe un texto alternativo descriptivo." };
    const meta = declaredMeta(form, user.email, "upload");
    if ("ok" in meta) return meta;
    const ref = await importFromUrl(String(form.get("url") ?? "").trim(), {
      kind: kindOf(t.type),
      alt,
      license: meta.license,
      author: meta.author,
      sourceUrl: meta.sourceUrl,
      permissionNote: meta.permissionNote,
      hotlink: form.get("hotlink") === "on",
      user: user.email,
    });
    await applyImage(t.type, t.id, ref);
    return done(t.type, t.id, "Imagen importada y asignada.");
  } catch (e) {
    return fail(e);
  }
}

export async function useLibraryImage(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  try {
    const t = target.parse(Object.fromEntries(form));
    const media = await db().get("media", String(form.get("mediaId")));
    if (!media) return { ok: false, message: "Imagen no encontrada." };
    if (!media.meta) return { ok: false, message: "Esta imagen no tiene licencia registrada. Súbela de nuevo indicando su procedencia." };
    const alt = String(form.get("alt") ?? "").trim() || media.alt;
    if (alt.length < 8) return { ok: false, message: "Escribe un texto alternativo descriptivo." };
    await applyImage(t.type, t.id, { src: media.url, alt, width: media.width, height: media.height, credit: attributionText(media.meta), meta: { ...media.meta, status: "approved" } });
    return done(t.type, t.id, "Imagen de la biblioteca asignada.");
  } catch (e) {
    return fail(e);
  }
}

/** Ajusta texto alternativo y punto focal de la imagen actual sin cambiarla. */
export async function updateCurrentImage(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  const t = target.parse(Object.fromEntries(form));
  const alt = String(form.get("alt") ?? "").trim();
  if (alt.length < 8) return { ok: false, message: "Escribe un texto alternativo descriptivo." };
  const doc = t.type === "post" ? await db().get("posts", t.id) : await db().get("phones", t.id);
  if (!doc) return { ok: false, message: "No encontrado." };
  const cur = "cover" in doc ? doc.cover : doc.image;
  const ref = { ...cur, alt, meta: cur.meta ? { ...cur.meta, focalX: focal(form.get("focalX")), focalY: focal(form.get("focalY")) } : undefined };
  await applyImage(t.type, t.id, ref);
  return done(t.type, t.id, "Imagen actualizada.");
}

export async function runAutoPropose(): Promise<ActionResult> {
  await requireUser();
  const r = await autoPropose(20);
  revalidatePath("/admin/imagenes");
  const errs = r.errors.length ? ` Errores: ${r.errors.slice(0, 3).join(" · ")}` : "";
  return { ok: r.errors.length === 0 || r.proposed > 0, message: `${r.searched} contenidos revisados, ${r.proposed} con propuesta.${errs}` };
}

/** Comprueba la conexión real con cada proveedor configurado. */
export async function testProviders(): Promise<ActionResult> {
  await requireUser();
  const configured = providerInfo().filter((p) => p.configured);
  const results = await Promise.all(
    configured.map(async (p) => {
      try {
        const r = await searchProvider(p.id, "smartphone", { perPage: 1 });
        return `${p.name}: OK (${r.length})`;
      } catch (e) {
        return `${p.name}: ${(e as Error).message}`;
      }
    }),
  );
  const ok = results.every((r) => r.includes(": OK"));
  return { ok, message: results.join(" · ") };
}
