"use server";

import { z } from "zod";
import type { ActionResult } from "@/components/admin/forms";
import { requireUser } from "@/lib/auth";
import { db, newId } from "@/lib/db";
import { revalidateSite } from "@/lib/revalidate";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(60),
  domain: z.string().trim().max(100),
  program: z.string().trim().max(80),
  param: z.string().trim().max(40).regex(/^[a-zA-Z0-9_-]*$/, "Parámetro no válido"),
  value: z.string().trim().max(120),
});

export async function saveStore(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser("admin");
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  const enabled = form.get("enabled") === "on";
  if (enabled && (!d.param || !d.value)) return { ok: false, message: "Para activar el programa indica el parámetro y tu identificador de afiliado." };
  const existing = d.id ? await db().get("stores", d.id) : null;
  await db().put("stores", {
    id: existing?.id ?? newId("store-"),
    name: d.name,
    domain: d.domain,
    affiliate: d.program || d.param || d.value ? { program: d.program || d.name, param: d.param, value: d.value, enabled } : undefined,
  });
  revalidateSite();
  return { ok: true, message: enabled ? "Tienda guardada con el programa de afiliación activo." : "Tienda guardada." };
}
