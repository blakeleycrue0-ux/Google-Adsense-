"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/components/admin/forms";
import { requireUser } from "@/lib/auth";
import { photoProblems, slotLabel } from "@/lib/devices";
import { importFromUrl, ImportError, storeImage } from "@/lib/images/import";
import { attributionText, isUsable, LICENSES } from "@/lib/images/licenses";
import { getDevice, importCatalog, importCommonsPhoto, setDevicePhoto } from "@/lib/images/library";
import { revalidateSite } from "@/lib/revalidate";
import type { DeviceSlot, ImageMeta, LicenseCode } from "@/lib/types";

const slotSchema = z.enum(["main", "front", "back"]);
const targetSchema = z.object({ deviceId: z.string().min(1).max(120), slot: slotSchema });
const LICENSES_ALLOWED: LicenseCode[] = ["own", "press", "retailer", "cc0", "pdm", "cc-by", "cc-by-sa"];
const focal = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  return Number.isFinite(n) && v !== "" && v !== null ? Math.max(0, Math.min(100, n)) : undefined;
};
const text = (form: FormData, k: string, max = 300) => String(form.get(k) ?? "").trim().slice(0, max);
/** Solo enlaces http(s): evita «javascript:» y similares en los créditos. */
const httpUrl = (v: string) => (v && /^https?:\/\/[^\s]+$/i.test(v) ? v : undefined);

function done(deviceId: string, message: string): ActionResult {
  revalidateSite();
  revalidatePath("/admin/imagenes/biblioteca");
  revalidatePath(`/admin/imagenes/biblioteca/${deviceId}`);
  return { ok: true, message };
}

function fail(e: unknown): ActionResult {
  if (e instanceof ImportError || e instanceof z.ZodError) return { ok: false, message: e instanceof z.ZodError ? "Datos no válidos." : e.message };
  const msg = (e as Error).message ?? "";
  if (msg.includes("solo lectura")) return { ok: false, message: msg };
  console.error(e);
  return { ok: false, message: "No se ha podido completar la operación." };
}

async function deviceOr404(id: string) {
  const d = await getDevice(id);
  if (!d) throw new ImportError("Dispositivo no encontrado.");
  return d;
}

/** Procedencia declarada al subir o importar por URL. Siempre entra como propuesta. */
function declared(form: FormData): ImageMeta | ActionResult {
  const license = String(form.get("license") ?? "") as LicenseCode;
  if (!LICENSES_ALLOWED.includes(license) || !isUsable(license)) return { ok: false, message: "Elige una licencia admitida." };
  const sourceRaw = text(form, "sourceUrl", 500);
  const sourceUrl = httpUrl(sourceRaw);
  if (sourceRaw && !sourceUrl) return { ok: false, message: "La página de origen debe ser una URL http(s)." };
  return {
    status: "proposed",
    provider: license === "press" ? "press" : license === "retailer" ? "retailer" : "upload",
    license,
    licenseName: LICENSES[license].name,
    licenseUrl: httpUrl(text(form, "licenseUrl", 300)) ?? LICENSES[license].url,
    author: text(form, "author", 200) || undefined,
    sourceUrl,
    permissionNote: text(form, "permissionNote") || undefined,
    changes: text(form, "changes", 200) || "Redimensionada y convertida a WebP",
    attributionRequired: LICENSES[license].attribution,
  };
}

export async function importCatalogAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  try {
    const phase = form.get("phase") === "2" ? 2 : 1;
    const r = await importCatalog(phase);
    revalidatePath("/admin/imagenes/biblioteca");
    revalidateSite();
    return { ok: true, message: `Catálogo ${phase === 1 ? "fase 1" : "completo"}: ${r.created} nuevos, ${r.updated} actualizados, ${r.unchanged} sin cambios · ${r.linked} fichas enlazadas · ${r.total} dispositivos.` };
  } catch (e) {
    return fail(e);
  }
}

export async function uploadDevicePhoto(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  try {
    const t = targetSchema.parse({ deviceId: form.get("deviceId"), slot: form.get("slot") });
    const device = await deviceOr404(t.deviceId);
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) return { ok: false, message: "Selecciona una imagen." };
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) return { ok: false, message: "Formato no admitido (JPG, PNG, WebP o AVIF)." };
    if (file.size > 25 * 1024 * 1024) return { ok: false, message: "La imagen supera los 25 MB." };
    const meta = declared(form);
    if (!meta || "ok" in meta) return meta;
    const alt = text(form, "alt", 160) || `${device.brand} ${device.model}`;
    const item = await storeImage(Buffer.from(await file.arrayBuffer()), `${device.id}-${t.slot}`, "phone", meta, alt);
    await setDevicePhoto(device.id, t.slot, { src: item.url, alt, width: item.width, height: item.height, credit: attributionText(meta), meta });
    return done(device.id, `${slotLabel(t.slot)} subida como propuesta. Revísala y apruébala para publicarla.`);
  } catch (e) {
    return fail(e);
  }
}

export async function importUrlDevicePhoto(_: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const t = targetSchema.parse({ deviceId: form.get("deviceId"), slot: form.get("slot") });
    const device = await deviceOr404(t.deviceId);
    const url = text(form, "url", 1000);
    if (!url) return { ok: false, message: "Indica la URL de la imagen." };
    const meta = declared(form);
    if (!meta || "ok" in meta) return meta;
    const alt = text(form, "alt", 160) || `${device.brand} ${device.model}`;
    // importFromUrl comprueba la licencia, bloquea redes privadas y valida tipo y tamaño.
    const ref = await importFromUrl(url, { kind: "phone", alt, license: meta.license, author: meta.author, sourceUrl: meta.sourceUrl ?? url, permissionNote: meta.permissionNote, user: user.email });
    const proposed: ImageMeta = { ...ref.meta!, ...meta, sourceUrl: meta.sourceUrl ?? url, provider: ref.meta!.provider, status: "proposed", approvedAt: undefined, approvedBy: undefined };
    await setDevicePhoto(device.id, t.slot, { ...ref, credit: attributionText(proposed), meta: proposed });
    return done(device.id, `${slotLabel(t.slot)} importada como propuesta. Revísala y apruébala para publicarla.`);
  } catch (e) {
    return fail(e);
  }
}

export async function importCommonsAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const t = targetSchema.parse({ deviceId: form.get("deviceId"), slot: form.get("slot") });
    const device = await deviceOr404(t.deviceId);
    const r = await importCommonsPhoto(device, t.slot, text(form, "url", 1000), user.email);
    const hint = r.matches.length ? `Commons la clasifica como «${r.matches[0]}».` : "Ninguna categoría de Commons nombra el modelo exacto: compruébalo con cuidado.";
    return done(device.id, `${slotLabel(t.slot)} importada de Commons como propuesta (${r.file.license.name}, ${r.file.author ?? "autor sin indicar"}). ${hint}`);
  } catch (e) {
    return fail(e);
  }
}

export async function approveDevicePhoto(_: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const t = targetSchema.parse({ deviceId: form.get("deviceId"), slot: form.get("slot") });
    const device = await deviceOr404(t.deviceId);
    const ref = device.photos[t.slot];
    if (!ref?.meta) return { ok: false, message: "No hay ninguna foto en esta vista." };
    if (form.get("confirmModel") !== "on") return { ok: false, message: `Confirma que la foto muestra exactamente el ${device.brand} ${device.model}.` };
    const problems = photoProblems(ref);
    if (problems.length) return { ok: false, message: `No se puede aprobar: ${problems.join(" · ")}.` };
    await setDevicePhoto(device.id, t.slot, { ...ref, meta: { ...ref.meta, status: "approved", approvedAt: new Date().toISOString(), approvedBy: user.email } });
    return done(device.id, `${slotLabel(t.slot)} aprobada: ya se muestra en la web.`);
  } catch (e) {
    return fail(e);
  }
}

/** Corrige textos y datos de licencia. Si la foto estaba aprobada, vuelve a quedar como propuesta. */
export async function updateDevicePhoto(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  try {
    const t = targetSchema.parse({ deviceId: form.get("deviceId"), slot: form.get("slot") });
    const device = await deviceOr404(t.deviceId);
    const ref = device.photos[t.slot];
    if (!ref?.meta) return { ok: false, message: "No hay ninguna foto en esta vista." };
    const sourceRaw = text(form, "sourceUrl", 500);
    if (sourceRaw && !httpUrl(sourceRaw)) return { ok: false, message: "La página de origen debe ser una URL http(s)." };
    const license = String(form.get("license") ?? ref.meta.license) as LicenseCode;
    if (!(license in LICENSES)) return { ok: false, message: "Licencia no válida." };
    const licenseChanged = license !== ref.meta.license || (text(form, "author", 200) || undefined) !== ref.meta.author || (httpUrl(sourceRaw) ?? undefined) !== ref.meta.sourceUrl;
    const meta: ImageMeta = {
      ...ref.meta,
      license,
      licenseName: license === ref.meta.license ? ref.meta.licenseName : LICENSES[license].name,
      licenseUrl: license === ref.meta.license ? ref.meta.licenseUrl : LICENSES[license].url,
      attributionRequired: LICENSES[license].attribution,
      author: text(form, "author", 200) || undefined,
      sourceUrl: httpUrl(sourceRaw),
      permissionNote: text(form, "permissionNote") || ref.meta.permissionNote,
      changes: text(form, "changes", 200) || undefined,
      focalX: focal(form.get("focalX")),
      focalY: focal(form.get("focalY")),
      ...(licenseChanged ? { status: "proposed" as const, approvedAt: undefined, approvedBy: undefined } : {}),
    };
    await setDevicePhoto(device.id, t.slot, { ...ref, alt: text(form, "alt", 160) || ref.alt, credit: attributionText(meta), meta });
    return done(device.id, licenseChanged ? "Datos guardados. Ha cambiado la licencia o la autoría: vuelve a aprobarla." : "Datos guardados.");
  } catch (e) {
    return fail(e);
  }
}

/** Quita la foto de la vista (el archivo sigue en Medios). Exige confirmación expresa. */
export async function removeDevicePhoto(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  try {
    const t = targetSchema.parse({ deviceId: form.get("deviceId"), slot: form.get("slot") });
    if (form.get("confirmRemove") !== "on") return { ok: false, message: "Marca la casilla para confirmar que quieres quitar la foto." };
    const device = await deviceOr404(t.deviceId);
    if (!device.photos[t.slot]) return { ok: false, message: "No hay ninguna foto en esta vista." };
    await setDevicePhoto(device.id, t.slot as DeviceSlot, null);
    return done(device.id, `${slotLabel(t.slot)} quitada. El archivo sigue disponible en Medios.`);
  } catch (e) {
    return fail(e);
  }
}

