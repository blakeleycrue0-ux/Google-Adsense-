import type { Author, Category, Phone, Post, Settings, Store } from "@/lib/types";
import { absoluteUrl } from "@/lib/settings";
import { phoneName } from "@/lib/phones";

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

export function organizationLd(s: Settings) {
  const sameAs = [s.social.x, s.social.instagram, s.social.youtube].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: s.siteName,
    url: absoluteUrl(s, "/"),
    logo: { "@type": "ImageObject", url: absoluteUrl(s, "/logo.png"), width: 512, height: 512 },
    ...(sameAs.length ? { sameAs } : {}),
    publishingPrinciples: absoluteUrl(s, "/legal/sobre-nosotros"),
    ...(s.contactEmail ? { email: s.contactEmail } : {}),
  };
}

export function articleLd(s: Settings, post: Post, author: Author | null, category?: Category) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title.slice(0, 110),
    description: post.seoDescription || post.subtitle,
    image: [absoluteUrl(s, post.cover.src)],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt > (post.publishedAt ?? "") ? post.updatedAt : post.publishedAt,
    mainEntityOfPage: absoluteUrl(s, `/noticias/${post.slug}`),
    articleSection: category?.name,
    keywords: post.tags.join(", "),
    inLanguage: "es-ES",
    author: author
      ? { "@type": author.slug === "redaccion" ? "Organization" : "Person", name: author.name, url: absoluteUrl(s, `/autor/${author.slug}`) }
      : { "@type": "Organization", name: s.siteName },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: s.siteName,
      logo: { "@type": "ImageObject", url: absoluteUrl(s, "/logo.png") },
    },
    ...(post.sources.length ? { citation: post.sources.map((x) => x.url) } : {}),
  };
}

/**
 * Datos de producto. Solo se incluyen ofertas con precio verificado (no demo),
 * y nunca valoraciones ni reseñas que no existan.
 */
export function productLd(s: Settings, phone: Phone, stores: Map<string, Store>) {
  const offers = phone.offers.filter((o) => o.source !== "demo");
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: phoneName(phone),
    brand: { "@type": "Brand", name: phone.brand },
    description: phone.summary,
    image: phone.image.illustrative ? undefined : [absoluteUrl(s, phone.image.src)],
    url: absoluteUrl(s, `/moviles/${phone.slug}`),
    ...(offers.length
      ? {
          offers: offers.map((o) => ({
            "@type": "Offer",
            price: o.price.toFixed(2),
            priceCurrency: o.currency,
            seller: { "@type": "Organization", name: stores.get(o.storeId)?.name ?? "Tienda" },
            url: absoluteUrl(s, `/go/${o.linkId}`),
            priceValidUntil: undefined,
          })),
        }
      : {}),
  };
}

export function breadcrumbLd(s: Settings, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(s, it.path),
    })),
  };
}
