import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { logout } from "../login/actions";

export const metadata: Metadata = { title: "Panel", robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const s = await getSettings();
  return (
    <div className="min-h-dvh bg-surface">
      <header className="border-b border-line bg-paper">
        <div className="container-x flex flex-wrap items-center justify-between gap-3 py-3">
          <Link href="/admin" className="font-extrabold">
            {s.siteName} <span className="font-normal text-muted">· Redacción</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            <Link href="/admin/noticia/nueva" className="btn btn-primary px-3 py-1.5">
              + Nueva noticia
            </Link>
            <Link href="/admin" className="rounded px-3 py-1.5 hover:bg-surface">
              Noticias
            </Link>
            <Link href="/admin/ajustes" className="rounded px-3 py-1.5 hover:bg-surface">
              Ajustes
            </Link>
            <Link href="/" target="_blank" className="rounded px-3 py-1.5 hover:bg-surface">
              Ver web ↗
            </Link>
            <form action={logout}>
              <button className="rounded px-3 py-1.5 text-muted hover:bg-surface" title={user.email}>
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="container-x py-8">{children}</main>
    </div>
  );
}
