import Link from "next/link";
import { CATEGORIES } from "@/lib/site";
import type { Settings } from "@/lib/types";

const LEGAL = [
  { href: "/sobre-mi", label: "Sobre mí" },
  { href: "/contacto", label: "Contacto" },
  { href: "/aviso-legal", label: "Aviso legal" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/cookies", label: "Cookies" },
];

export function Footer({ s }: { s: Settings }) {
  const social = [
    s.instagram && { href: `https://www.instagram.com/${s.instagram.replace(/^@/, "")}`, label: "Instagram" },
    s.tiktok && { href: `https://www.tiktok.com/@${s.tiktok.replace(/^@/, "")}`, label: "TikTok" },
  ].filter(Boolean) as { href: string; label: string }[];
  return (
    <footer className="mt-16 bg-ink text-white/75 print:hidden">
      <div className="container-x py-10">
        <p className="headline text-3xl text-white">{s.siteName}</p>
        <p className="mt-1 text-sm">{s.tagline}</p>
        {social.length > 0 && (
          <p className="mt-3 flex gap-4 text-sm">
            {social.map((x) => (
              <a key={x.href} href={x.href} target="_blank" rel="noopener noreferrer me" className="text-white underline underline-offset-2">
                {x.label}
              </a>
            ))}
          </p>
        )}
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
          <FooterList title="Categorías" items={CATEGORIES.map((c) => ({ href: `/recetas/${c.id}`, label: c.name }))} />
          <FooterList title="Información" items={LEGAL} />
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="container-x flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-white/55">
          <p>
            © {new Date().getFullYear()} {s.siteName}
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
