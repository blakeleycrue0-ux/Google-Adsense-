import Link from "next/link";
import { formatLongDate } from "@/lib/format";
import { ISLANDS, SECTIONS } from "@/lib/site";
import { MobileMenu } from "./MobileMenu";

export function Logo({ name, className = "" }: { name: string; className?: string }) {
  return (
    <Link href="/" className={`headline whitespace-nowrap tracking-tight ${className}`} aria-label={`${name}, portada`}>
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
 * Móvil: barra fija (menú · nombre · buscar) y las cuatro islas en pestañas
 * de igual ancho, sin nada que se corte. Escritorio: cabecera de periódico con
 * fecha, nombre centrado y dos filas de navegación.
 */
export function Header({ siteName, tagline }: { siteName: string; tagline: string }) {
  const islands = ISLANDS.filter((i) => i.id !== "baleares");
  return (
    <>
      {/* Móvil y tableta */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper lg:hidden">
        <div className="container-x flex h-14 items-center justify-between">
          <MobileMenu />
          <Logo name={siteName} className="text-[1.6rem]" />
          <Link href="/buscar" className="-mr-2 grid size-11 place-items-center rounded-md hover:bg-surface" aria-label="Buscar">
            <SearchIcon />
          </Link>
        </div>
      </header>
      <nav aria-label="Islas" className="border-b border-line bg-surface lg:hidden">
        <ul className="container-x grid grid-cols-4 text-center text-[13px] font-semibold">
          {islands.map((i) => (
            <li key={i.id}>
              <Link href={`/isla/${i.id}`} className="block py-2.5 text-ink-2 hover:text-ink">
                {i.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Escritorio */}
      <header className="hidden border-b border-line lg:block">
        <div className="container-x grid grid-cols-[1fr_auto_1fr] items-center gap-6 pb-5 pt-6">
          <p className="text-sm text-muted first-letter:uppercase">{formatLongDate()}</p>
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
        <nav aria-label="Islas" className="border-y border-ink">
          <ul className="container-x flex items-center justify-center gap-1 text-sm font-semibold">
            <li>
              <Link href="/ultima-hora" className="flex items-center gap-2 px-4 py-3 hover:bg-surface">
                <span className="live-dot size-2 rounded-full bg-ink" aria-hidden />
                Última hora
              </Link>
            </li>
            {ISLANDS.map((i) => (
              <li key={i.id}>
                <Link href={`/isla/${i.id}`} className="block px-4 py-3 hover:bg-surface">
                  {i.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Secciones">
          <ul className="container-x flex flex-wrap items-center justify-center gap-x-1 text-[13px] text-ink-2">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <Link href={`/seccion/${s.id}`} className="block px-3 py-2.5 hover:text-ink hover:underline">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
    </>
  );
}
