import type { MetadataRoute } from "next";
import { getPublished } from "@/lib/content";
import { recipePath } from "@/lib/recipes";
import { absoluteUrl, getSettings } from "@/lib/settings";
import { CATEGORIES } from "@/lib/site";

export const revalidate = 300;

/** Solo URLs públicas y canónicas: nunca recetas privadas ni el panel. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [s, recipes] = await Promise.all([getSettings(), getPublished()]);
  const url = (p: string) => absoluteUrl(s, p);
  const fixed = ["/", "/recetas", "/sobre-mi", "/contacto", "/aviso-legal", "/privacidad", "/cookies"];
  const withRecipes = new Set(recipes.map((r) => r.category));
  return [
    ...fixed.map((p) => ({ url: url(p), changeFrequency: p === "/" || p === "/recetas" ? ("daily" as const) : ("monthly" as const) })),
    // Solo categorías con recetas: una página vacía no aporta nada a Google.
    ...CATEGORIES.filter((c) => withRecipes.has(c.id)).map((c) => ({ url: url(`/recetas/${c.id}`), changeFrequency: "weekly" as const })),
    ...recipes.map((r) => ({
      url: url(recipePath(r)),
      lastModified: r.updatedAt,
      images: r.photo ? [url(r.photo.url)] : undefined,
    })),
  ];
}
