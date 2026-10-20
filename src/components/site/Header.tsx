import Link from "next/link";
import { formatLongDate } from "@/lib/format";
import { ISLANDS, SECTIONS } from "@/lib/site";

export function Logo({ name }: { name: string }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${name}, portada`}>
      <svg viewBox="0 0 64 64" className="size-9 shrink-0" aria-hidden>
        <rect width="64" height="64" rx="12" fill="#0b5c8a" />
        <path d="M10 40c6-5 12-5 18 0s12 5 18 0 8-4 8-4" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
        <path d="M10 28c6-5 12-5 18 0s12 5 18 0 8-4 8-4" fill="none" stroke="#9fd3f2" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <span className="text-2xl font-extrabold tracking-tight sm:text-3xl">{name}</span>
    </Link>
  );
}

export function Header({ siteName, tagline }: { siteName: string; tagline: string }) {
  return (
    <header className="border-b border-line bg-paper">
      <div className="container-x flex items-center justify-between gap-4 py-4">
        <div>
          <Logo name={siteName} />
          <p className="mt-1 hidden text-sm text-muted sm:block">{tagline}</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden text-sm text-muted first-letter:uppercase md:block">{formatLongDate()}</p>
          <Link href="/buscar" className="btn btn-ghost px-3" aria-label="Buscar">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
        </div>
      </div>
      <nav aria-label="Islas" className="bg-sea text-white">
        <ul className="container-x flex gap-1 overflow-x-auto py-1 text-sm font-semibold [scrollbar-width:none]">
          <li>
            <Link href="/ultima-hora" className="flex items-center gap-1.5 whitespace-nowrap rounded px-3 py-2 hover:bg-white/10">
              <span className="live-dot size-2 rounded-full bg-[#ff6b5e]" aria-hidden />
              Última hora
            </Link>
          </li>
          {ISLANDS.map((i) => (
            <li key={i.id}>
              <Link href={`/isla/${i.id}`} className="block whitespace-nowrap rounded px-3 py-2 hover:bg-white/10">
                {i.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Secciones" className="border-b border-line">
        <ul className="container-x flex gap-1 overflow-x-auto py-1 text-sm text-ink-2 [scrollbar-width:none]">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <Link href={`/seccion/${s.id}`} className="block whitespace-nowrap rounded px-3 py-2 hover:bg-surface hover:text-sea">
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
