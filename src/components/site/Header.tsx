import Link from "next/link";
import { CATEGORIES } from "@/lib/site";
import { MobileMenu } from "./MobileMenu";

export function Logo({ name, className = "" }: { name: string; className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 whitespace-nowrap font-bold tracking-tight ${className}`} aria-label={`${name}, inicio`}>
      <span className="bg-celeste size-3 shrink-0 rounded-full" aria-hidden />
      <span className="truncate">{name}</span>
    </Link>
  );
}

export const SearchIcon = ({ className = "size-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

const NAV = [
  { href: "/recetas", label: "Recetas" },
  { href: "/recetas/postres", label: "Postres" },
  { href: "/sobre-mi", label: "Sobre mí" },
];

/** Barra fija con el nombre, el buscador y, debajo, las categorías deslizables. */
export function Header({ siteName }: { siteName: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper print:hidden">
      <div className="container-x flex h-16 items-center gap-2">
        <div className="lg:hidden">
          <MobileMenu />
        </div>
        <Logo name={siteName} className="min-w-0 text-lg sm:text-xl" />
        <nav aria-label="Principal" className="ml-8 hidden gap-6 text-sm font-medium text-ink-2 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <form action="/buscar" role="search" className="ml-auto hidden w-72 items-center gap-2 rounded-full bg-surface px-4 sm:flex">
          <SearchIcon className="size-4 shrink-0 text-muted" />
          <input name="q" placeholder="Buscar receta o ingrediente" aria-label="Buscar recetas" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </form>
        <Link href="/buscar" className="-mr-2 ml-auto grid size-11 place-items-center rounded-full hover:bg-surface sm:hidden" aria-label="Buscar recetas">
          <SearchIcon />
        </Link>
      </div>
      <nav aria-label="Categorías" className="no-scrollbar overflow-x-auto">
        <ul className="container-x flex gap-2 pb-3 text-[13px] font-medium">
          {CATEGORIES.map((c) => (
            <li key={c.id} className="shrink-0">
              <Link href={`/recetas/${c.id}`} className="block rounded-full bg-surface px-3.5 py-1.5 text-ink-2 hover:bg-ink hover:text-white">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
