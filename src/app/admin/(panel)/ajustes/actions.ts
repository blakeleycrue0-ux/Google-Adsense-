"use server";

import { z } from "zod";
import type { ActionResult } from "@/components/admin/forms";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidateSite } from "@/lib/revalidate";
import { AD_PLACEMENTS, getSettings } from "@/lib/settings";
import type { AdPlacement, Settings } from "@/lib/types";

const general = z.object({
  siteName: z.string().trim().min(2).max(40),
  tagline: z.string().trim().max(80),
  siteUrl: z.string().trim().url("URL del sitio no válida"),
  contactEmail: z.string().trim().email().or(z.literal("")),
  gaMeasurementId: z.string().trim().regex(/^(G-[A-Z0-9]{4,20})?$/, "El ID de Google Analytics tiene el formato G-XXXXXXX"),
  searchConsoleVerification: z.string().trim().max(120),
  consentMode: z.enum(["builtin", "external"]),
  disclosure: z.string().trim().min(20).max(300),
  ownerName: z.string().trim().max(160),
  taxId: z.string().trim().max(40),
  address: z.string().trim().max(240),
  registry: z.string().trim().max(240),
  x: z.string().trim().url().or(z.literal("")),
  instagram: z.string().trim().url().or(z.literal("")),
  youtube: z.string().trim().url().or(z.literal("")),
});

export async function saveSettings(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser("admin");
  const parsed = general.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  const cur = await getSettings();
  const next: Settings = {
    ...cur,
    siteName: d.siteName,
    tagline: d.tagline,
    siteUrl: d.siteUrl.replace(/\/$/, ""),
    contactEmail: d.contactEmail,
    demoMode: form.get("demoMode") === "on",
    analytics: { gaMeasurementId: d.gaMeasurementId, searchConsoleVerification: d.searchConsoleVerification },
    consent: { mode: d.consentMode },
    affiliates: { disclosure: d.disclosure },
    legal: { ownerName: d.ownerName, taxId: d.taxId, address: d.address, registry: d.registry },
    social: { x: d.x, instagram: d.instagram, youtube: d.youtube },
    updatedAt: new Date().toISOString(),
  };
  try {
    await db().saveSettings(next);
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  revalidateSite();
  return { ok: true, message: "Ajustes guardados." };
}

export async function saveAds(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser("admin");
  const client = String(form.get("client") ?? "").trim();
  const enabled = form.get("enabled") === "on";
  if (client && !/^ca-pub-\d{10,20}$/.test(client)) return { ok: false, message: "El ID de editor debe tener el formato ca-pub-XXXXXXXXXXXXXXXX." };
  if (enabled && !client) return { ok: false, message: "Indica el ID de editor antes de activar AdSense." };
  const cur = await getSettings();
  const slots = { ...cur.ads.slots };
  for (const p of AD_PLACEMENTS) {
    const slotId = String(form.get(`slot_${p.id}`) ?? "").trim();
    if (slotId && !/^\d{6,20}$/.test(slotId)) return { ok: false, message: `El ID de bloque de «${p.label}» debe ser numérico.` };
    const format = String(form.get(`format_${p.id}`) ?? "auto") as Settings["ads"]["slots"][AdPlacement]["format"];
    slots[p.id] = { slotId, enabled: form.get(`enabled_${p.id}`) === "on", format: ["auto", "fluid", "rectangle", "horizontal"].includes(format) ? format : "auto" };
  }
  await db().saveSettings({ ...cur, ads: { enabled, client, showPlaceholders: false, slots }, updatedAt: new Date().toISOString() });
  revalidateSite();
  return { ok: true, message: "Configuración de publicidad guardada." };
}
