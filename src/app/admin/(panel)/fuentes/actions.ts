"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/components/admin/forms";
import { requireUser } from "@/lib/auth";
import { db, newId } from "@/lib/db";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(80),
  feedUrl: z.string().trim().url("URL del feed no válida"),
  siteUrl: z.string().trim().url("URL del sitio no válida"),
  language: z.string().trim().min(2).max(5),
  defaultCategoryId: z.string().optional(),
});

export async function saveSource(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  const existing = d.id ? await db().get("sources", d.id) : null;
  await db().put("sources", {
    ...(existing ?? {}),
    id: existing?.id ?? newId("src_"),
    name: d.name,
    feedUrl: d.feedUrl,
    siteUrl: d.siteUrl,
    language: d.language,
    defaultCategoryId: d.defaultCategoryId || undefined,
    active: form.get("active") === "on",
  });
  revalidatePath("/admin/fuentes");
  return { ok: true, message: existing ? "Fuente actualizada." : "Fuente añadida." };
}

export async function deleteSource(form: FormData) {
  await requireUser();
  await db().remove("sources", String(form.get("id")));
  revalidatePath("/admin/fuentes");
}
