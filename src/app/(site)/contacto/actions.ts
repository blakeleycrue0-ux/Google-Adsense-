"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { db, newId } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type ContactState = { ok: boolean; message: string; errors?: Record<string, string> } | null;

const schema = z.object({
  name: z.string().trim().min(2, "Indica tu nombre").max(80),
  email: z.string().trim().email("Correo no válido").max(120),
  subject: z.string().trim().min(3, "Indica un asunto").max(140),
  message: z.string().trim().min(10, "El mensaje es demasiado corto").max(4000),
  privacy: z.literal("on", { message: "Debes aceptar la política de privacidad" }),
});

export async function sendContact(_: ContactState, form: FormData): Promise<ContactState> {
  // Campo trampa para bots: los humanos no lo ven.
  if (form.get("website")) return { ok: true, message: "Mensaje enviado. Gracias." };
  const ip = clientIp(await headers());
  if (!rateLimit(`contact:${ip}`, 5, 3600_000)) {
    return { ok: false, message: "Has enviado demasiados mensajes. Inténtalo más tarde." };
  }
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, message: "Revisa los campos marcados.", errors };
  }
  const { name, email, subject, message } = parsed.data;
  try {
    await db().put("messages", { id: newId("msg_"), name, email, subject, message, createdAt: new Date().toISOString(), read: false });
  } catch {
    return { ok: false, message: "No se ha podido enviar el mensaje. Inténtalo de nuevo más tarde." };
  }
  return { ok: true, message: "Mensaje enviado. Te responderemos lo antes posible." };
}
