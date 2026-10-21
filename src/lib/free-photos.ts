import "server-only";
import { PHOTO_QUERIES } from "@/data/fotos-recetas";
import { slugify } from "@/lib/format";
import { brightScore } from "@/lib/free-photos-score";
import { storeImage } from "@/lib/images";
import { getSettings } from "@/lib/settings";
import type { Photo } from "@/lib/types";

/**
 * Fotos profesionales de Pexels (licencia libre: uso comercial permitido, sin
 * pedir permiso). Se descargan, se optimizan y se guardan como las subidas
 * desde el panel, con el fotógrafo y el enlace al original para el crédito.
 *
 * Para que todas las recetas tengan un aire parecido, entre los primeros
 * resultados se elige la foto más luminosa y limpia (fondo claro, emplatado
 * sencillo), que encaja con el blanco y gris de la web.
 */

const API = "https://api.pexels.com/v1/search";
const CANDIDATES = 12;

type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  alt: string | null;
  avg_color: string | null;
  src: { large2x: string };
};

export async function pexelsKey() {
  return process.env.PEXELS_API_KEY?.trim() || (await getSettings()).pexelsKey.trim();
}

async function search(key: string, query: string): Promise<PexelsPhoto[]> {
  const params = new URLSearchParams({ query, orientation: "landscape", size: "large", per_page: String(CANDIDATES) });
  const res = await fetch(`${API}?${params}`, { headers: { Authorization: key }, cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (res.status === 401 || res.status === 403) throw new Error("La clave de Pexels no es válida. Revísala en Ajustes.");
  if (!res.ok) throw new Error(`Pexels respondió ${res.status}. Prueba de nuevo en unos minutos.`);
  const photos: PexelsPhoto[] = (await res.json()).photos ?? [];
  return photos.filter((p) => p.width >= 1200 && p.photographer.trim());
}

/** Qué se busca para una receta: las búsquedas preparadas (recetas iniciales) y, si no dan nada, el título. */
export function photoQueries(title: string) {
  const preset = PHOTO_QUERIES[slugify(title)] ?? [];
  return [...new Set([...preset, title.replace(/\(.*?\)/g, "").trim()].filter(Boolean))];
}

/** Sin foto, o con una de las de Wikimedia que se pusieron automáticamente antes: se cambia por una de Pexels. */
export function needsAutoPhoto(photo: Pick<Photo, "sourceUrl"> | null) {
  return !photo || Boolean(photo.sourceUrl?.includes("commons.wikimedia.org"));
}

/** Devuelve la mejor foto que no esté en `exclude` (enlaces ya propuestos), ya guardada. */
export async function findFreePhoto(title: string, exclude: string[] = []): Promise<Photo | null> {
  const key = await pexelsKey();
  if (!key) throw new Error("Falta la clave de Pexels: ponla en Ajustes → Fotos.");
  for (const query of photoQueries(title)) {
    const best = (await search(key, query))
      .map((p, rank) => ({ p, score: brightScore(p.avg_color, rank) }))
      .filter(({ p }) => !exclude.includes(p.url))
      .sort((a, b) => b.score - a.score)[0]?.p;
    if (!best) continue;
    const res = await fetch(best.src.large2x, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`No se ha podido descargar la foto (${res.status}).`);
    const stored = await storeImage(Buffer.from(await res.arrayBuffer()), title);
    return { ...stored, alt: title, license: "pexels", author: best.photographer.trim().slice(0, 120), sourceUrl: best.url };
  }
  return null;
}
