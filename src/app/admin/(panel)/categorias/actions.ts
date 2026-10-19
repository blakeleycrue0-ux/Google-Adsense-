"use server";

import { z } from "zod";
import type { ActionResult } from "@/components/admin/forms";
import { requireUser } from "@/lib/auth";
import { db, newId } from "@/lib/db";
import { slugify } from "@/lib/format";
import { revalidateSite } from "@/lib/revalidate";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(50),
  slug: z.string().trim().max(60).optional(),
  emoji: z.string().trim().max(8).optional(),
  description: z.string().trim().max(240),
  order: z.coerce.number().int().min(0).max(999),
});

export async function saveCategory(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  const all = await db().list("categories");
  const slug = slugify(d.slug || d.name);
  if (all.some((c) => c.slug === slug && c.id !== d.id)) return { ok: false, message: "Ya existe una categoría con ese slug." };
  const existing = all.find((c) => c.id === d.id);
  await db().put("categories", {
    ...(existing ?? {}),
    id: existing?.id ?? newId("cat_"),
    name: d.name,
    slug,
    emoji: d.emoji || undefined,
    description: d.description,
    order: d.order,
    inNav: existing?.inNav,
  });
  revalidateSite();
  return { ok: true, message: existing ? "Categoría actualizada." : "Categoría creada." };
}

export async function deleteCategory(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  const id = String(form.get("id"));
  const used = (await db().list("posts")).filter((p) => p.categoryId === id).length;
  if (used) return { ok: false, message: `No se puede eliminar: ${used} artículo(s) la usan. Muévelos antes.` };
  await db().remove("categories", id);
  revalidateSite();
  return { ok: true, message: "Categoría eliminada." };
}
