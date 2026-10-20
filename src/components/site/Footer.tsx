import Link from "next/link";
import { ISLANDS, SECTIONS } from "@/lib/site";

const LEGAL = [
  { href: "/quienes-somos", label: "Quiénes somos" },
  { href: "/normas-editoriales", label: "Normas editoriales" },
  { href: "/contacto", label: "Contacto" },
  { href: "/aviso-legal", label: "Aviso legal" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/cookies", label: "Cookies" },
];

export function Footer({ siteName, tagline }: { siteName: string; tagline: string }) {
  return (
    <footer className="mt-16 bg-ink text-white/80">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xl font-extrabold text-white">{siteName}</p>
          <p className="mt-2 text-sm">{tagline}.</p>
          <Link href="/feed.xml" className="mt-4 inline-block text-sm underline underline-offset-2">
            Suscríbete por RSS
          </Link>
        </div>
        <FooterList title="Islas" items={ISLANDS.map((i) => ({ href: `/isla/${i.id}`, label: i.name }))} />
        <FooterList title="Secciones" items={SECTIONS.map((s) => ({ href: `/seccion/${s.id}`, label: s.name }))} />
        <FooterList title="Información" items={LEGAL} />
      </div>
      <div className="border-t border-white/10">
        <p className="container-x py-5 text-xs text-white/60">
          © {new Date().getFullYear()} {siteName}. Las fotos indican su autoría y licencia.
        </p>
      </div>
    </footer>
  );
}

function FooterList({ title, items }: { title: string; items: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <p className="kicker mb-3 text-white">{title}</p>
      <ul className="space-y-2 text-sm">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="hover:text-white hover:underline">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
