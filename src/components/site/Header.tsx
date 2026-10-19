import { getCategories } from "@/lib/content";
import { formatLongDate } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { HeaderClient, type NavItem } from "./HeaderClient";

export const NAV: NavItem[] = [
  { href: "/", label: "Inicio" },
  { href: "/ultima-hora", label: "Última hora", live: true },
  { href: "/tecnologia", label: "Tecnología" },
  { href: "/moviles", label: "Móviles" },
  { href: "/comparativas", label: "Comparativas" },
  { href: "/ofertas", label: "Ofertas" },
];

export async function Header() {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  return (
    <HeaderClient
      siteName={settings.siteName}
      nav={NAV}
      categories={categories.map((c) => ({ href: `/categoria/${c.slug}`, label: c.name }))}
      dateLabel={formatLongDate(new Date().toISOString())}
    />
  );
}
