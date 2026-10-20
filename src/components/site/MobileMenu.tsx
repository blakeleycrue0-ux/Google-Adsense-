"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ISLANDS, SECTIONS } from "@/lib/site";

const INFO = [
  { href: "/quienes-somos", label: "Quiénes somos" },
  { href: "/contacto", label: "Contacto" },
  { href: "/aviso-legal", label: "Aviso legal" },
  { href: "/privacidad", label: "Privacidad" },
];

/** Botón de menú y panel a pantalla completa (móvil y tableta). */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  // Bloquea el scroll de fondo mientras está abierto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        className="-ml-2 grid size-11 place-items-center rounded-md hover:bg-surface"
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-14 z-50 overflow-y-auto bg-paper">
          {/* Se cierra al pulsar cualquier enlace. */}
          <nav
            className="container-x space-y-8 py-6"
            aria-label="Menú"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            <Link href="/ultima-hora" className="flex items-center gap-2 text-lg font-bold">
              <span className="live-dot size-2 rounded-full bg-ink" aria-hidden />
              Última hora
            </Link>
            <MenuGroup title="Islas" items={ISLANDS.map((i) => ({ href: `/isla/${i.id}`, label: i.name }))} />
            <MenuGroup title="Secciones" items={SECTIONS.map((s) => ({ href: `/seccion/${s.id}`, label: s.name }))} />
            <MenuGroup title="Información" items={INFO} small />
          </nav>
        </div>
      )}
    </>
  );
}

function MenuGroup({ title, items, small }: { title: string; items: { href: string; label: string }[]; small?: boolean }) {
  return (
    <div>
      <p className="kicker mb-2 border-b border-ink pb-2 text-muted">{title}</p>
      <ul className="grid grid-cols-2 gap-x-4">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className={`block border-b border-line py-3 ${small ? "text-sm text-ink-2" : "font-semibold"}`}>
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
