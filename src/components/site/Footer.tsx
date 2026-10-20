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
    <footer className="mt-16 bg-ink text-white/75">
      <div className="container-x py-10">
        <p className="headline text-3xl text-white">{siteName}</p>
        <p className="mt-1 text-sm">{tagline}</p>
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
          <FooterList title="Islas" items={ISLANDS.map((i) => ({ href: `/isla/${i.id}`, label: i.name }))} />
          <FooterList title="Secciones" items={SECTIONS.map((s) => ({ href: `/seccion/${s.id}`, label: s.name }))} />
          <FooterList title="Información" items={LEGAL} />
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="container-x flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-white/55">
          <p>
            © {new Date().getFullYear()} {siteName}
          </p>
          <Link href="/feed.xml" className="hover:text-white">
            RSS
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterList({ title, items }: { title: string; items: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <p className="kicker mb-3 text-white">{title}</p>
      <ul className="space-y-0.5 text-sm">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="block py-1 hover:text-white">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
