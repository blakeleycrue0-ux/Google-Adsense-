import { absoluteUrl } from "@/lib/settings";
import { photoCredit } from "@/lib/photos";
import { islandName, sectionName } from "@/lib/site";
import type { Article, Settings } from "@/lib/types";

export function organizationLd(s: Settings) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: s.siteName,
    url: absoluteUrl(s, "/"),
    logo: { "@type": "ImageObject", url: absoluteUrl(s, "/icon.svg") },
    publishingPrinciples: absoluteUrl(s, "/normas-editoriales"),
    ...(s.contactEmail ? { email: s.contactEmail } : {}),
  };
}

export function articleLd(s: Settings, a: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: a.title.slice(0, 110),
    description: a.summary,
    ...(a.photo
      ? { image: [{ "@type": "ImageObject", url: absoluteUrl(s, a.photo.url), width: a.photo.width, height: a.photo.height, creditText: photoCredit(a.photo) }] }
      : {}),
    datePublished: a.publishedAt,
    dateModified: a.updatedAt > (a.publishedAt ?? "") ? a.updatedAt : a.publishedAt,
    mainEntityOfPage: absoluteUrl(s, `/noticia/${a.slug}`),
    articleSection: sectionName(a.section),
    contentLocation: { "@type": "Place", name: `${islandName(a.island)}, Illes Balears` },
    inLanguage: "es-ES",
    author: a.authorName ? { "@type": "Person", name: a.authorName } : { "@type": "Organization", name: s.siteName },
    publisher: { "@type": "NewsMediaOrganization", name: s.siteName, logo: { "@type": "ImageObject", url: absoluteUrl(s, "/icon.svg") } },
  };
}
