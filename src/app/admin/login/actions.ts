"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clearSession, hashPassword, setSession, verifyPassword } from "@/lib/auth";
import { db, newId } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { User } from "@/lib/types";

export type LoginState = { error?: string } | null;

const SETUP_ALLOWED = () => process.env.NODE_ENV !== "production" || Boolean(process.env.ADMIN_SETUP_TOKEN);

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const ip = clientIp(await headers());
  if (!rateLimit(`login:${ip}`, 10, 15 * 60_000)) return { error: "Demasiados intentos. Espera unos minutos." };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  let users: User[];
  try {
    users = await db().list("users");
  } catch (e) {
    return { error: `No se puede acceder al almacenamiento: ${(e as Error).message}` };
  }
  let user = users.find((u) => u.email.toLowerCase() === email);

  // Arranque: si aún no hay cuentas, se acepta la definida en las variables de entorno.
  if (!users.length && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    if (email === process.env.ADMIN_EMAIL.toLowerCase() && password === process.env.ADMIN_PASSWORD) {
      user = { id: newId("usr_"), email, name: "Redacción", passwordHash: await hashPassword(password), createdAt: new Date().toISOString() };
      await db().put("users", user);
    }
  }

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Correo o contraseña incorrectos." };
  }
  await setSession(user);
  redirect("/admin");
}

const setupSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(60),
  email: z.string().trim().toLowerCase().email("Correo no válido"),
  password: z.string().min(10, "La contraseña debe tener al menos 10 caracteres"),
  token: z.string().optional(),
});

/** Primera cuenta (solo si no existe ninguna). */
export async function setupAdmin(_: LoginState, form: FormData): Promise<LoginState> {
  if (!SETUP_ALLOWED()) return { error: "La configuración inicial no está habilitada." };
  if ((await db().list("users")).length) return { error: "Ya existe una cuenta." };
  const parsed = setupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (process.env.ADMIN_SETUP_TOKEN && parsed.data.token !== process.env.ADMIN_SETUP_TOKEN) {
    return { error: "Código de configuración incorrecto." };
  }
  const user: User = {
    id: newId("usr_"),
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash: await hashPassword(parsed.data.password),
    createdAt: new Date().toISOString(),
  };
  try {
    await db().put("users", user);
  } catch (e) {
    return { error: (e as Error).message };
  }
  await setSession(user);
  redirect("/admin");
}

export async function logout() {
  await clearSession();
  redirect("/admin/login");
}
