"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/site/Logo";
import { CloseIcon, MenuIcon } from "@/components/ui/Icons";

type Item = { href: string; label: string; badge?: number; adminOnly?: boolean };

export function AdminNav({
  groups,
  user,
  logout,
}: {
  groups: { title: string; items: Item[] }[];
  user: { name: string; role: string };
  logout: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Panel" className="space-y-6">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="kicker px-3 text-faint">{g.title}</p>
          <ul className="mt-2 space-y-0.5">
            {g.items.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  onClick={() => setOpen(false)}
                  aria-current={active(it.href) ? "page" : undefined}
                  className="flex h-8 items-center justify-between rounded-sm px-3 text-[14px] text-ink-2 transition-colors hover:bg-surface hover:text-ink aria-[current=page]:bg-surface aria-[current=page]:font-medium aria-[current=page]:text-ink"
                >
                  {it.label}
                  {!!it.badge && (
                    <span className="rounded-full bg-ink px-1.5 font-mono text-[10px] leading-4 text-paper">{it.badge}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-line pt-4">
      <p className="px-3 text-[13px] font-medium">{user.name}</p>
      <p className="px-3 text-[12px] text-muted">{user.role === "admin" ? "Administración" : "Edición"}</p>
      <div className="mt-3 flex gap-1">
        <Link href="/" target="_blank" className="btn-ghost btn-sm">Ver web ↗</Link>
        <form action={logout}>
          <button className="btn-ghost btn-sm">Salir</button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-paper px-3 py-5 lg:flex">
        <Link href="/admin" className="mb-7 flex items-center gap-2 px-3">
          <LogoMark className="size-5 text-ink" />
          <span className="text-[17px] font-bold lowercase tracking-[-0.04em]">voltio</span>
          <span className="kicker ml-1 text-faint">panel</span>
        </Link>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        {footer}
      </aside>

      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <LogoMark className="size-5 text-ink" />
          <span className="text-[16px] font-bold lowercase tracking-[-0.04em]">voltio</span>
          <span className="kicker text-faint">panel</span>
        </Link>
        <button type="button" onClick={() => setOpen(true)} className="rounded-sm p-2 hover:bg-surface" aria-label="Abrir menú del panel">
          <MenuIcon />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} aria-label="Cerrar" />
          <div className="absolute inset-y-0 left-0 flex w-72 animate-fade-up flex-col bg-paper p-4">
            <button type="button" onClick={() => setOpen(false)} className="mb-4 self-end rounded-sm p-2 hover:bg-surface" aria-label="Cerrar menú">
              <CloseIcon />
            </button>
            <div className="flex-1 overflow-y-auto">{nav}</div>
            {footer}
          </div>
        </div>
      )}
    </>
  );
}
