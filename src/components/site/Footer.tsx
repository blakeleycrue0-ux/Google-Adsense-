import Link from "next/link";
import { getCategories } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import { ConsentPreferencesLink } from "@/components/consent/ConsentPreferencesLink";
import { LogoMark } from "./Logo";

export async function Footer() {
  const [s, categories] = await Promise.all([getSettings(), getCategories()]);
  const year = new Date().getFullYear();
  const cols = [
    {
      title: "Secciones",
      links: categories.map((c) => ({ href: `/categoria/${c.slug}`, label: c.name })),
    },
    {
      title: "Herramientas",
      links: [
        { href: "/moviles", label: "Buscador de móviles" },
        { href: "/comparar", label: "Comparador" },
        { href: "/comparativas", label: "Guías de compra" },
        { href: "/ofertas", label: "Ofertas" },
        { href: "/ultima-hora", label: "Última hora" },
      ],
    },
    {
      title: "El medio",
      links: [
        { href: "/legal/sobre-nosotros", label: "Sobre nosotros" },
        { href: "/contacto", label: "Contacto" },
        { href: "/legal/publicidad-y-afiliados", label: "Publicidad y afiliados" },
        { href: "/creditos-imagenes", label: "Créditos de imágenes" },
        { href: "/feed.xml", label: "RSS" },
      ],
    },
    {
      title: "Legal",
      links: [
        { href: "/legal/aviso-legal", label: "Aviso legal" },
        { href: "/legal/privacidad", label: "Privacidad" },
        { href: "/legal/cookies", label: "Cookies" },
      ],
    },
  ];
  return (
    <footer className="mt-24 border-t border-line bg-paper">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <Link href="/" className="inline-flex items-center gap-2" aria-label={s.siteName}>
            <LogoMark className="size-6 text-ink" />
            <span className="text-[22px] font-bold lowercase tracking-[-0.045em]">{s.siteName}</span>
          </Link>
          <p className="mt-4 text-[14px] leading-relaxed text-muted">
            {s.tagline} Noticias con fuentes, guías de compra y herramientas para elegir tecnología con criterio.
          </p>
        </div>
        {cols.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="kicker text-muted">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[14px] text-ink-2 transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-3 py-6 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {s.siteName}. {s.affiliates.disclosure}
          </p>
          <ConsentPreferencesLink />
        </div>
      </div>
    </footer>
  );
}
