"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function toggleRead(form: FormData) {
  await requireUser();
  const m = await db().get("messages", String(form.get("id")));
  if (m) await db().put("messages", { ...m, read: !m.read });
  revalidatePath("/admin", "layout");
}

export async function deleteMessage(form: FormData) {
  await requireUser();
  await db().remove("messages", String(form.get("id")));
  revalidatePath("/admin", "layout");
}
