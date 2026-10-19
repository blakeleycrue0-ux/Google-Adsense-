"use server";

import { z } from "zod";
import type { ActionResult } from "@/components/admin/forms";
import { requireUser } from "@/lib/auth";
import { db, newId } from "@/lib/db";
import { slugify } from "@/lib/format";
import { revalidateSite } from "@/lib/revalidate";

const optNum = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().optional());
const schema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(4).max(120),
  slug: z.string().trim().max(100).optional(),
  emoji: z.string().trim().max(8).optional(),
  intro: z.string().trim().min(10).max(400),
  body: z.string().max(30_000),
  minPrice: optNum,
  maxPrice: optNum,
  order: z.coerce.number().int().min(0).max(999),
});

export async function saveGuide(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  const all = await db().list("guides");
  const existing = all.find((g) => g.id === d.id);
  const slug = slugify(d.slug || d.title);
  if (all.some((g) => g.slug === slug && g.id !== existing?.id)) return { ok: false, message: "Ya existe una guía con esa URL." };
  await db().put("guides", {
    id: existing?.id ?? newId("guide_"),
    slug,
    title: d.title,
    emoji: d.emoji || undefined,
    intro: d.intro,
    body: d.body,
    minPrice: d.minPrice,
    maxPrice: d.maxPrice,
    order: d.order,
    phoneIds: form.getAll("phoneIds").map(String),
    updatedAt: new Date().toISOString(),
    isDemo: false,
  });
  revalidateSite();
  return { ok: true, message: "Guía guardada." };
}

export async function deleteGuide(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  await db().remove("guides", String(form.get("id")));
  revalidateSite();
  return { ok: true, message: "Guía eliminada." };
}
