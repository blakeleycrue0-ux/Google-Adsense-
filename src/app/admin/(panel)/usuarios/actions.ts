"use server";

import { z } from "zod";
import type { ActionResult } from "@/components/admin/forms";
import { hashPassword, requireUser } from "@/lib/auth";
import { db, newId } from "@/lib/db";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["admin", "editor"]),
  password: z.string().optional(),
});

export async function saveUser(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireUser("admin");
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  const users = await db().list("users");
  const existing = users.find((u) => u.id === d.id);
  if (users.some((u) => u.email === d.email && u.id !== existing?.id)) return { ok: false, message: "Ese correo ya está en uso." };
  if (!existing && (!d.password || d.password.length < 12)) return { ok: false, message: "La contraseña debe tener al menos 12 caracteres." };
  if (d.password && d.password.length < 12) return { ok: false, message: "La contraseña debe tener al menos 12 caracteres." };
  if (existing?.id === me.id && d.role !== "admin") return { ok: false, message: "No puedes quitarte el rol de administración." };
  await db().put("users", {
    id: existing?.id ?? newId("usr_"),
    name: d.name,
    email: d.email,
    role: d.role,
    passwordHash: d.password ? await hashPassword(d.password) : existing!.passwordHash,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  });
  return { ok: true, message: existing ? "Usuario actualizado." : "Usuario creado." };
}

export async function deleteUser(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireUser("admin");
  const id = String(form.get("id"));
  if (id === me.id) return { ok: false, message: "No puedes eliminar tu propia cuenta." };
  await db().remove("users", id);
  return { ok: true, message: "Usuario eliminado." };
}
