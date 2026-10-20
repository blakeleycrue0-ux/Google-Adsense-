import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { LoginForm, SetupForm } from "./LoginForms";

export const metadata: Metadata = { title: "Acceso", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  const s = await getSettings();
  const hasUsers = await db()
    .list("users")
    .then((u) => u.length > 0)
    .catch(() => true);
  const setupAllowed = process.env.NODE_ENV !== "production" || Boolean(process.env.ADMIN_SETUP_TOKEN);
  const showSetup = !hasUsers && setupAllowed && !process.env.ADMIN_EMAIL;
  return (
    <main className="grid min-h-dvh place-items-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-paper p-6 shadow-sm">
        <p className="text-xl font-extrabold">{s.siteName}</p>
        <h1 className="mb-6 text-sm text-muted">Panel de redacción</h1>
        {showSetup ? <SetupForm needsToken={Boolean(process.env.ADMIN_SETUP_TOKEN)} /> : <LoginForm />}
      </div>
    </main>
  );
}
