"use server";

import { z } from "zod";
import type { ActionResult } from "@/components/admin/forms";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidateSite } from "@/lib/revalidate";

const schema = z.object({ id: z.string(), title: z.string().trim().min(2).max(120), body: z.string().max(60_000) });

export async function saveLegalPage(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const page = await db().get("legal", parsed.data.id);
  if (!page) return { ok: false, message: "Página no encontrada." };
  await db().put("legal", {
    ...page,
    title: parsed.data.title,
    body: parsed.data.body,
    needsLegalReview: form.get("needsLegalReview") === "on",
    updatedAt: new Date().toISOString(),
  });
  revalidateSite();
  return { ok: true, message: "Página guardada." };
}
