"use server";

import { z } from "zod";
import type { ActionResult } from "@/components/admin/forms";
import { requireUser } from "@/lib/auth";
import { db, newId } from "@/lib/db";
import { revalidateSite } from "@/lib/revalidate";

const schema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(2).max(160),
  storeId: z.string().min(1),
  targetUrl: z.string().trim().regex(/^https:\/\//, "La URL debe empezar por https://"),
});

export async function saveLink(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  const existing = d.id ? await db().get("links", d.id) : null;
  const now = new Date().toISOString();
  await db().put("links", {
    id: existing?.id ?? newId("lnk_"),
    label: d.label,
    storeId: d.storeId,
    targetUrl: d.targetUrl,
    active: form.get("active") === "on",
    applyAffiliate: form.get("applyAffiliate") === "on",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
  revalidateSite();
  return { ok: true, message: "Enlace guardado." };
}
