"use server";

import { z } from "zod";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidateSite } from "@/lib/revalidate";
import { getSettings } from "@/lib/settings";

export type FormState = { ok: boolean; message: string } | null;

const optionalSlot = z.union([z.literal(""), z.string().regex(/^\d{6,20}$/, "El ID de bloque son solo números (p. ej. 1234567890)")]);

const schema = z.object({
  siteName: z.string().trim().min(2).max(60),
  tagline: z.string().trim().max(120),
  siteUrl: z.string().trim().url("La dirección de la web debe empezar por https://"),
  ownerName: z.string().trim().max(120),
  ownerNif: z.string().trim().max(20),
  ownerAddress: z.string().trim().max(200),
  contactEmail: z.union([z.literal(""), z.string().trim().email("Correo de contacto no válido")]),
  adsenseClient: z.union([z.literal(""), z.string().trim().regex(/^ca-pub-\d{10,20}$/, "El ID de editor tiene el formato ca-pub-1234567890123456")]),
  adsEnabled: z.literal("on").optional(),
  slotHome: optionalSlot,
  slotArticle: optionalSlot,
  searchConsoleVerification: z.string().trim().max(100),
});

export async function saveSettings(_: FormState, form: FormData): Promise<FormState> {
  await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  const current = await getSettings();
  try {
    await db().saveSettings({
      ...current,
      siteName: d.siteName,
      tagline: d.tagline,
      siteUrl: d.siteUrl.replace(/\/$/, ""),
      ownerName: d.ownerName,
      ownerNif: d.ownerNif,
      ownerAddress: d.ownerAddress,
      contactEmail: d.contactEmail,
      adsenseClient: d.adsenseClient,
      adsEnabled: Boolean(d.adsEnabled) && Boolean(d.adsenseClient),
      slots: { home: d.slotHome, article: d.slotArticle },
      // Acepta la etiqueta <meta> completa o solo el código.
      searchConsoleVerification: d.searchConsoleVerification.match(/content="([^"]+)"/)?.[1] ?? d.searchConsoleVerification,
    });
  } catch (e) {
    return { ok: false, message: `No se ha podido guardar: ${(e as Error).message}` };
  }
  revalidateSite();
  return { ok: true, message: "Ajustes guardados." };
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (!(await verifyPassword(current, user.passwordHash))) return { ok: false, message: "La contraseña actual no es correcta." };
  if (next.length < 10) return { ok: false, message: "La nueva contraseña debe tener al menos 10 caracteres." };
  await db().put("users", { ...user, passwordHash: await hashPassword(next) });
  return { ok: true, message: "Contraseña cambiada." };
}
