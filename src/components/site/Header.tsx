import Link from "next/link";
import { CATEGORIES } from "@/lib/site";
import { MobileMenu } from "./MobileMenu";

export function Logo({ name, className = "" }: { name: string; className?: string }) {
  return (
    <Link href="/" className={`headline whitespace-nowrap tracking-tight ${className}`} aria-label={`${name}, inicio`}>
      {name}
    </Link>
  );
}

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

/**
 * Móvil: barra fija (menú · nombre · buscar). Escritorio: nombre centrado y
 * una fila con las categorías.
 */
export function Header({ siteName, tagline }: { siteName: string; tagline: string }) {
  return (
    <>
      {/* Móvil y tableta */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper lg:hidden print:hidden">
        <div className="container-x flex h-14 items-center justify-between">
          <MobileMenu />
          <Logo name={siteName} className="text-[1.6rem]" />
          <Link href="/buscar" className="-mr-2 grid size-11 place-items-center rounded-md hover:bg-surface" aria-label="Buscar recetas">
            <SearchIcon />
          </Link>
        </div>
      </header>

      {/* Escritorio */}
      <header className="hidden border-b border-line lg:block print:hidden">
        <div className="container-x grid grid-cols-[1fr_auto_1fr] items-center gap-6 pb-5 pt-6">
          <nav aria-label="Principal" className="flex gap-5 text-sm font-semibold">
            <Link href="/recetas" className="hover:underline">
              Todas las recetas
            </Link>
            <Link href="/sobre-mi" className="hover:underline">
              Sobre mí
            </Link>
          </nav>
          <div className="text-center">
            <Logo name={siteName} className="text-5xl" />
            <p className="mt-1.5 text-sm text-muted">{tagline}</p>
          </div>
          <div className="flex justify-end">
            <Link href="/buscar" className="btn btn-ghost gap-2 px-3 text-sm">
              <SearchIcon /> Buscar
            </Link>
          </div>
        </div>
        <nav aria-label="Categorías" className="border-y border-ink">
          <ul className="container-x flex flex-wrap items-center justify-center text-[13px] font-semibold">
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <Link href={`/recetas/${c.id}`} className="block px-3 py-3 hover:bg-surface">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
    </>
  );
}
