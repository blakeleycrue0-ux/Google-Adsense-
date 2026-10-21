import "server-only";
import sharp from "sharp";
import { PHOTO_QUERIES } from "@/data/fotos-recetas";
import { slugify } from "@/lib/format";
import { brightScore } from "@/lib/free-photos-score";
import { storeImage } from "@/lib/images";
import { getSettings } from "@/lib/settings";
import type { Photo } from "@/lib/types";

/**
 * Fotos de Pixabay (licencia libre: uso comercial permitido, sin pedir
 * permiso). Pixabay pide descargarlas en vez de enlazarlas, así que se guardan
 * optimizadas como las subidas desde el panel, con el autor y el enlace al
 * original para el crédito.
 *
 * Para que todas las recetas tengan un aire parecido, entre los primeros
 * resultados se elige la foto más luminosa y limpia (fondo claro, emplatado
 * sencillo), que encaja con el blanco y gris de la web.
 */

const API = "https://pixabay.com/api/";
const CANDIDATES = 10;

type PixabayHit = {
  id: number;
  pageURL: string;
  previewURL: string;
  largeImageURL: string;
  imageWidth: number;
  user: string;
};

export async function pixabayKey() {
  return process.env.PIXABAY_API_KEY?.trim() || (await getSettings()).pixabayKey.trim();
}

async function search(key: string, query: string): Promise<PixabayHit[]> {
  const params = new URLSearchParams({
    key,
    q: query.slice(0, 100),
    lang: "en",
    image_type: "photo",
    orientation: "horizontal",
    category: "food",
    min_width: "1200",
    safesearch: "true",
    per_page: String(CANDIDATES),
  });
  const res = await fetch(`${API}?${params}`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (res.status === 400 && /key/i.test(await res.clone().text())) throw new Error("La clave de Pixabay no es válida. Revísala en Ajustes.");
  if (res.status === 429) throw new Error("Pixabay pide esperar un poco (demasiadas búsquedas). Prueba en un minuto.");
  if (!res.ok) throw new Error(`Pixabay respondió ${res.status}. Prueba de nuevo en unos minutos.`);
  const hits: PixabayHit[] = (await res.json()).hits ?? [];
  return hits.filter((h) => h.imageWidth >= 1200 && h.largeImageURL);
}

/** Color medio de la miniatura (150 px), para puntuar lo luminosa y limpia que es la foto. */
async function averageColor(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return null;
    const { channels } = await sharp(Buffer.from(await res.arrayBuffer())).stats();
    return "#" + channels.slice(0, 3).map((c) => Math.round(c.mean).toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

/** Qué se busca para una receta: las búsquedas preparadas (recetas iniciales) y, si no dan nada, el título. */
export function photoQueries(title: string) {
  const preset = PHOTO_QUERIES[slugify(title)] ?? [];
  return [...new Set([...preset, title.replace(/\(.*?\)/g, "").trim()].filter(Boolean))];
}

/** Sin foto, o con una de las de Wikimedia que se pusieron automáticamente antes: se cambia. */
export function needsAutoPhoto(photo: Pick<Photo, "sourceUrl"> | null) {
  return !photo || Boolean(photo.sourceUrl?.includes("commons.wikimedia.org"));
}

/** Devuelve la mejor foto que no esté en `exclude` (enlaces ya propuestos), ya guardada. */
export async function findFreePhoto(title: string, exclude: string[] = []): Promise<Photo | null> {
  const key = await pixabayKey();
  if (!key) throw new Error("Falta la clave de Pixabay: ponla en Ajustes → Fotos.");
  for (const query of photoQueries(title)) {
    const hits = (await search(key, query)).filter((h) => !exclude.includes(h.pageURL));
    if (!hits.length) continue;
    const colors = await Promise.all(hits.map((h) => averageColor(h.previewURL)));
    const best = hits.map((h, rank) => ({ h, score: brightScore(colors[rank], rank) })).sort((a, b) => b.score - a.score)[0].h;
    const res = await fetch(best.largeImageURL, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`No se ha podido descargar la foto (${res.status}).`);
    const stored = await storeImage(Buffer.from(await res.arrayBuffer()), title);
    return { ...stored, alt: title, license: "pixabay", author: best.user.trim().slice(0, 120) || "Pixabay", sourceUrl: best.pageURL };
  }
  return null;
}
