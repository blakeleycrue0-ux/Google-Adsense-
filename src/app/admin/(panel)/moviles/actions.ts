"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/components/admin/forms";
import { requireUser } from "@/lib/auth";
import { db, newId } from "@/lib/db";
import { slugify } from "@/lib/format";
import { revalidateSite } from "@/lib/revalidate";
import type { AffiliateLink, Phone, PriceOffer } from "@/lib/types";

const num = z.coerce.number();
const optNum = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().optional());
const list = (s: FormDataEntryValue | null) => String(s ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
const nums = (s: FormDataEntryValue | null) => String(s ?? "").split(/[,\s/]+/).map(Number).filter((n) => Number.isFinite(n) && n > 0);

const schema = z.object({
  id: z.string().optional(),
  brand: z.string().trim().min(1).max(40),
  model: z.string().trim().min(1).max(80),
  slug: z.string().trim().max(100).optional(),
  releaseYear: num.int().min(2015).max(2100),
  os: z.enum(["android", "ios"]),
  summary: z.string().trim().min(10).max(400),
  imageSrc: z.string().trim().min(1, "Añade una imagen"),
  imageAlt: z.string().trim().min(3, "Añade un texto alternativo a la imagen"),
  officialUrl: z.string().trim().url().or(z.literal("")),
  performanceTier: z.enum(["basica", "media", "alta", "tope"]),
  displayInches: num.positive(),
  displayType: z.string().trim().min(2),
  refreshHz: num.int().positive(),
  resolution: z.string().trim().min(3),
  chipset: z.string().trim().min(2),
  batteryMah: num.int().positive(),
  chargingW: optNum,
  mainCameraMp: num.positive(),
  ultrawideMp: optNum,
  telephotoMp: optNum,
  telephotoZoom: z.string().trim().optional(),
  frontCameraMp: num.positive(),
  weightG: num.positive(),
  ipRating: z.string().trim().optional(),
  osUpdatesYears: optNum,
});

export async function savePhone(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  const d = parsed.data;
  const all = await db().list("phones");
  const existing = all.find((p) => p.id === d.id);
  const slug = slugify(d.slug || `${d.brand} ${d.model}`);
  if (all.some((p) => p.slug === slug && p.id !== existing?.id)) return { ok: false, message: "Ya existe una ficha con esa URL." };
  const ramGB = nums(form.get("ramGB"));
  const storageGB = nums(form.get("storageGB"));
  if (!ramGB.length || !storageGB.length) return { ok: false, message: "Indica RAM y almacenamiento (p. ej. «8, 12»)." };

  // Ofertas: filas offer_<i>_*. Cada una genera o actualiza su enlace administrable.
  const now = new Date().toISOString();
  const offers: PriceOffer[] = [];
  const links: AffiliateLink[] = [];
  for (let i = 0; i < 12; i++) {
    const storeId = String(form.get(`offer_${i}_store`) ?? "");
    const price = Number(form.get(`offer_${i}_price`));
    const url = String(form.get(`offer_${i}_url`) ?? "").trim();
    if (!storeId || !Number.isFinite(price) || price <= 0) continue;
    if (!/^https:\/\//.test(url)) return { ok: false, message: `La oferta ${i + 1} necesita una URL https de la tienda.` };
    const prev = existing?.offers.find((o) => o.id === form.get(`offer_${i}_id`));
    const linkId = prev?.linkId ?? `lnk-${slug}-${storeId.replace("store-", "")}-${newId().slice(0, 4)}`;
    const oldLink = await db().get("links", linkId);
    links.push({
      id: linkId,
      label: `${d.brand} ${d.model} · ${storeId.replace("store-", "")}`,
      storeId,
      targetUrl: url,
      active: true,
      applyAffiliate: oldLink?.applyAffiliate ?? true,
      createdAt: oldLink?.createdAt ?? now,
      updatedAt: now,
    });
    const verified = form.get(`offer_${i}_verified`) === "on";
    const changed = !prev || prev.price !== price;
    offers.push({
      id: prev?.id ?? newId("off_"),
      storeId,
      price,
      currency: "EUR",
      linkId,
      variant: String(form.get(`offer_${i}_variant`) ?? "").trim() || undefined,
      source: verified ? "manual" : prev?.source === "manual" && !changed ? "manual" : "demo",
      checkedAt: verified || changed ? now : prev!.checkedAt,
    });
  }

  const phone: Phone = {
    id: existing?.id ?? newId("ph_"),
    slug,
    brand: d.brand,
    model: d.model,
    releaseYear: d.releaseYear,
    os: d.os,
    summary: d.summary,
    image: { src: d.imageSrc, alt: d.imageAlt, illustrative: existing?.image.src === d.imageSrc ? existing.image.illustrative : false },
    officialUrl: d.officialUrl || undefined,
    performanceTier: d.performanceTier,
    specs: {
      displayInches: d.displayInches,
      displayType: d.displayType,
      refreshHz: d.refreshHz,
      resolution: d.resolution,
      chipset: d.chipset,
      ramGB,
      storageGB,
      batteryMah: d.batteryMah,
      chargingW: d.chargingW,
      mainCameraMp: d.mainCameraMp,
      ultrawideMp: d.ultrawideMp,
      telephotoMp: d.telephotoMp,
      telephotoZoom: d.telephotoZoom || undefined,
      frontCameraMp: d.frontCameraMp,
      weightG: d.weightG,
      ipRating: d.ipRating || undefined,
      fiveG: form.get("fiveG") === "on",
      osUpdatesYears: d.osUpdatesYears,
    },
    pros: list(form.get("pros")).slice(0, 8),
    cons: list(form.get("cons")).slice(0, 8),
    alternativeIds: form.getAll("alternativeIds").map(String).filter((id) => id !== existing?.id).slice(0, 6),
    offers,
    specsVerified: form.get("specsVerified") === "on",
    isDemo: existing?.isDemo && offers.some((o) => o.source === "demo"),
    updatedAt: now,
  };
  try {
    for (const l of links) await db().put("links", l);
    await db().put("phones", phone);
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  revalidateSite();
  return { ok: true, message: "Ficha guardada.", redirectTo: existing ? undefined : `/admin/moviles/${phone.id}` };
}

export async function deletePhone(form: FormData) {
  await requireUser();
  await db().remove("phones", String(form.get("id")));
  revalidateSite();
  redirect("/admin/moviles");
}
