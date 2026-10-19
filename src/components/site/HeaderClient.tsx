"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CloseIcon, MenuIcon, SearchIcon } from "@/components/ui/Icons";
import { Logo } from "./Logo";
import { SearchDialog } from "./SearchDialog";

export interface NavItem {
  href: string;
  label: string;
  live?: boolean;
}

export function HeaderClient({
  siteName,
  nav,
  categories,
  dateLabel,
}: {
  siteName: string;
  nav: NavItem[];
  categories: { href: string; label: string }[];
  dateLabel: string;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Cerrar el menú al navegar.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "/" && !/input|textarea|select/i.test((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-paper/90 backdrop-blur-md transition-[border-color] duration-300 supports-[backdrop-filter]:bg-paper/80 border-b ${
          scrolled ? "border-line" : "border-transparent"
        }`}
      >
        <div className="container-x flex h-[var(--header-h)] items-center gap-6">
          <Logo name={siteName} />

          <nav aria-label="Principal" className="hidden h-full flex-1 items-center gap-1 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="relative flex h-full items-center px-3 text-[14px] font-medium text-ink-2 transition-colors hover:text-ink aria-[current=page]:text-ink"
              >
                {item.live && <span className="live-dot mr-2" aria-hidden />}
                {item.label}
                <span
                  className={`absolute inset-x-3 bottom-0 h-px bg-ink transition-transform duration-300 ease-[var(--ease-out-soft)] origin-left ${
                    isActive(item.href) ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="group flex h-9 items-center gap-2 rounded-sm px-2.5 text-[13px] text-muted transition-colors hover:bg-surface hover:text-ink sm:border sm:border-line sm:pr-2"
              aria-label="Buscar"
            >
              <SearchIcon />
              <span className="hidden sm:inline">Buscar</span>
              <kbd className="ml-3 hidden rounded-xs border border-line bg-surface px-1.5 font-mono text-[10px] text-muted sm:inline">
                ⌘K
              </kbd>
            </button>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-sm transition-colors hover:bg-surface lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <MenuIcon width={22} height={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Menú móvil */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        className={`fixed inset-0 z-50 bg-paper transition-[opacity,visibility] duration-300 lg:hidden ${
          menuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="container-x flex h-[var(--header-h)] items-center justify-between border-b border-line">
          <Logo name={siteName} />
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="flex size-10 items-center justify-center rounded-sm hover:bg-surface"
            aria-label="Cerrar menú"
          >
            <CloseIcon width={22} height={22} />
          </button>
        </div>
        <div className="container-x h-[calc(100dvh-var(--header-h))] overflow-y-auto pb-10">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setSearchOpen(true);
            }}
            className="mt-5 flex h-12 w-full items-center gap-3 rounded-sm bg-surface px-4 text-left text-[15px] text-muted"
          >
            <SearchIcon /> Buscar noticias, móviles…
          </button>
          <nav aria-label="Principal móvil" className="mt-6">
            <ul>
              {nav.map((item, i) => (
                <li
                  key={item.href}
                  className={menuOpen ? "animate-fade-up" : ""}
                  style={{ animationDelay: `${60 + i * 35}ms` }}
                >
                  <Link
                    href={item.href}
                    className="flex items-center justify-between border-b border-line py-4 text-[26px] font-semibold tracking-[-0.03em]"
                  >
                    <span className="flex items-center gap-3">
                      {item.label}
                      {item.live && <span className="live-dot" aria-hidden />}
                    </span>
                    {isActive(item.href) && <span className="kicker text-muted">Aquí</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="kicker mt-8 text-muted">Secciones</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.href}>
                <Link
                  href={c.href}
                  className="inline-flex h-9 items-center rounded-sm border border-line px-3 text-[14px] transition-colors hover:border-ink"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="kicker mt-10 text-faint capitalize">{dateLabel}</p>
        </div>
      </div>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
