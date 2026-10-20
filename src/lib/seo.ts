import { photoCredit } from "@/lib/photos";
import { isoDuration, recipePath, totalMinutes } from "@/lib/recipes";
import { absoluteUrl } from "@/lib/settings";
import { categoryName } from "@/lib/site";
import type { Recipe, Settings } from "@/lib/types";

export function websiteLd(s: Settings) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: s.siteName,
    url: absoluteUrl(s, "/"),
    inLanguage: "es-ES",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: absoluteUrl(s, "/buscar") + "?q={search_term_string}" },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Datos estructurados Recipe: con ellos Google puede mostrar la receta con
 * foto y tiempo en los resultados. Solo incluye lo que la página muestra.
 */
export function recipeLd(s: Settings, r: Recipe) {
  const total = totalMinutes(r);
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: r.title,
    description: r.summary,
    ...(r.photo ? { image: [absoluteUrl(s, r.photo.url)] } : {}),
    author: { "@type": "Person", name: r.authorName || s.ownerName || s.siteName },
    datePublished: r.publishedAt,
    ...(r.prepMinutes ? { prepTime: isoDuration(r.prepMinutes) } : {}),
    ...(r.cookMinutes ? { cookTime: isoDuration(r.cookMinutes) } : {}),
    ...(total ? { totalTime: isoDuration(total) } : {}),
    ...(r.servings ? { recipeYield: r.servings } : {}),
    recipeCategory: categoryName(r.category),
    recipeCuisine: "Española",
    ...(r.tags.length ? { keywords: r.tags.join(", ") } : {}),
    recipeIngredient: r.ingredients.filter((l) => !l.startsWith("#")),
    recipeInstructions: r.steps.map((text, i) => ({ "@type": "HowToStep", position: i + 1, text })),
    mainEntityOfPage: absoluteUrl(s, recipePath(r)),
    ...(r.photo ? { thumbnailUrl: absoluteUrl(s, r.photo.url), creditText: photoCredit(r.photo) } : {}),
  };
}

export function breadcrumbLd(s: Settings, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(s, it.path) })),
  };
}
