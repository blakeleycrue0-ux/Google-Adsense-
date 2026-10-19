"use server";

import { z } from "zod";
import type { ActionResult } from "@/components/admin/forms";
import { requireUser } from "@/lib/auth";
import { db, newId } from "@/lib/db";
import { madridLocalToISO } from "@/lib/format";
import { revalidateSite } from "@/lib/revalidate";
import type { Deal } from "@/lib/types";

const optNum = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().positive().optional());
const schema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(4).max(160),
  productType: z.enum(["movil", "auriculares", "portatil", "tablet", "reloj", "otro"]),
  storeId: z.string().min(1, "Elige una tienda"),
  price: z.coerce.number().positive("Precio no válido"),
  previousPrice: optNum,
  url: z.string().trim().regex(/^https:\/\//, "La URL debe empezar por https://"),
  imageSrc: z.string().trim().optional(),
  expiresAt: z.string().optional(),
  notes: z.string().trim().max(300).optional(),
});

export async function saveDeal(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.previousPrice && d.previousPrice <= d.price) return { ok: false, message: "El precio anterior debe ser mayor que el actual." };
  if (d.previousPrice && form.get("previousVerified") !== "on") {
    return { ok: false, message: "Confirma que el precio anterior es verificable en la tienda, o déjalo vacío." };
  }
  const existing = d.id ? await db().get("deals", d.id) : null;
  const now = new Date().toISOString();
  const linkId = existing?.linkId ?? `lnk-${newId("deal")}`;
  const oldLink = await db().get("links", linkId);
  await db().put("links", {
    id: linkId,
    label: d.title,
    storeId: d.storeId,
    targetUrl: d.url,
    active: true,
    applyAffiliate: oldLink?.applyAffiliate ?? true,
    createdAt: oldLink?.createdAt ?? now,
    updatedAt: now,
  });
  const deal: Deal = {
    id: existing?.id ?? newId("deal_"),
    title: d.title,
    productType: d.productType,
    storeId: d.storeId,
    price: d.price,
    previousPrice: d.previousPrice,
    linkId,
    image: d.imageSrc ? { src: d.imageSrc, alt: d.title } : existing?.image,
    checkedAt: now,
    expiresAt: d.expiresAt ? (madridLocalToISO(d.expiresAt) ?? undefined) : undefined,
    notes: d.notes || undefined,
    isDemo: false,
    active: form.get("active") === "on",
  };
  await db().put("deals", deal);
  revalidateSite();
  return { ok: true, message: "Oferta guardada (precio marcado como comprobado ahora)." };
}

export async function deleteDeal(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  await db().remove("deals", String(form.get("id")));
  revalidateSite();
  return { ok: true, message: "Oferta eliminada." };
}
