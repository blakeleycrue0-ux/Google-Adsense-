import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/site/Logo";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LoginForm, SetupForm } from "./LoginForms";

export const metadata: Metadata = { title: "Acceso al panel", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  const noUsers = (await db().list("users")).length === 0;
  const envBootstrap = Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
  const setupAllowed = process.env.NODE_ENV !== "production" || Boolean(process.env.ADMIN_SETUP_TOKEN);
  const showSetup = noUsers && !envBootstrap && setupAllowed;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <LogoMark className="size-7 text-ink" />
          <span className="text-[22px] font-bold lowercase tracking-[-0.045em]">voltio</span>
        </Link>
        <div className="rounded-md border border-line bg-paper p-7">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em]">{showSetup ? "Configuración inicial" : "Panel de administración"}</h1>
          <p className="mb-6 mt-1 text-[13px] text-muted">
            {showSetup ? "No hay ninguna cuenta todavía. Crea la cuenta de administración." : "Accede con tu cuenta."}
          </p>
          {showSetup ? <SetupForm needsToken={Boolean(process.env.ADMIN_SETUP_TOKEN)} /> : <LoginForm />}
          {noUsers && !envBootstrap && !setupAllowed && (
            <p className="mt-4 text-[12px] text-muted">
              No hay cuentas. Define ADMIN_EMAIL y ADMIN_PASSWORD (o ADMIN_SETUP_TOKEN) en las variables de entorno.
            </p>
          )}
        </div>
        <p className="mt-6 text-center text-[12px] text-muted">
          <Link href="/" className="hover:text-ink">← Volver a la web</Link>
        </p>
      </div>
    </div>
  );
}
