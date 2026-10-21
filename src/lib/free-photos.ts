import "server-only";
import { PHOTO_QUERIES } from "@/data/fotos-recetas";
import { slugify } from "@/lib/format";
import { storeImage } from "@/lib/images";
import { commonsLicense } from "@/lib/photos";
import type { PhotoLicense } from "@/lib/site";
import type { Photo } from "@/lib/types";

/**
 * Busca en Wikimedia Commons una foto con licencia libre (CC0, dominio público,
 * CC BY o CC BY-SA), la descarga, la optimiza y la guarda como si se hubiera
 * subido desde el panel, con su autor y el enlace al original para el crédito.
 */

const API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = `LaLibretaDelFogon/1.0 (${process.env.URL ?? "https://lalibretadelfogon.netlify.app"})`;
// Fotos que no son del plato: carteles, envases, mapas, dibujos…
const NOT_A_DISH = /logo|map|diagram|icon|drawing|illustration|painting|sign|menu|label|packag|box|advert|poster|stamp|coat of arms|recipe card/i;

type CommonsPage = {
  index: number;
  title: string;
  imageinfo?: {
    thumburl?: string;
    thumbwidth?: number;
    thumbheight?: number;
    mime: string;
    descriptionurl: string;
    extmetadata?: Record<string, { value?: string }>;
  }[];
};

export type FreePhotoCandidate = { imageUrl: string; sourceUrl: string; license: PhotoLicense; author: string };

function plainText(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

async function search(query: string): Promise<FreePhotoCandidate[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "25",
    prop: "imageinfo",
    iiprop: "url|mime|extmetadata",
    iiextmetadatafilter: "LicenseShortName|Artist",
    iiurlwidth: "1280",
  });
  const res = await fetch(`${API}?${params}`, { headers: { "User-Agent": USER_AGENT }, cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Wikimedia Commons respondió ${res.status}.`);
  const pages: CommonsPage[] = (await res.json()).query?.pages ?? [];
  return pages
    .sort((a, b) => a.index - b.index)
    .flatMap((p) => {
      const info = p.imageinfo?.[0];
      if (!info?.thumburl || !info.thumbwidth || !info.thumbheight) return [];
      if (!/^image\/(jpeg|png|webp)$/.test(info.mime) || NOT_A_DISH.test(p.title)) return [];
      // Horizontales o casi cuadradas y con tamaño suficiente para la portada.
      const ratio = info.thumbwidth / info.thumbheight;
      if (info.thumbwidth < 900 || ratio < 1 || ratio > 2) return [];
      const license = commonsLicense(info.extmetadata?.LicenseShortName?.value ?? "");
      if (!license) return [];
      const author = plainText(info.extmetadata?.Artist?.value ?? "");
      if (license !== "cc0" && !author) return [];
      return [{ imageUrl: info.thumburl, sourceUrl: info.descriptionurl, license, author }];
    });
}

/** Qué se busca para una receta: la búsqueda preparada (recetas iniciales) y, si no da nada, el título. */
export function photoQueries(title: string) {
  const preset = PHOTO_QUERIES[slugify(title)];
  return [...new Set([preset, title.replace(/\(.*?\)/g, "").trim()].filter((q): q is string => Boolean(q)))];
}

/** Devuelve la primera foto libre que no esté en `exclude` (enlaces a Commons ya probados), ya guardada. */
export async function findFreePhoto(title: string, exclude: string[] = []): Promise<Photo | null> {
  for (const query of photoQueries(title)) {
    const candidate = (await search(query)).find((c) => !exclude.includes(c.sourceUrl));
    if (!candidate) continue;
    const res = await fetch(candidate.imageUrl, { headers: { "User-Agent": USER_AGENT }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`No se ha podido descargar la foto (${res.status}).`);
    const stored = await storeImage(Buffer.from(await res.arrayBuffer()), title);
    return { ...stored, alt: title, license: candidate.license, author: candidate.author, sourceUrl: candidate.sourceUrl };
  }
  return null;
}
