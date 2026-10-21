import { PHOTO_LICENSES, type PhotoLicense } from "@/lib/site";
import type { Photo } from "@/lib/types";

/** Texto del crédito que se muestra bajo la foto: «Foto: Ana Pérez / Unsplash». */
export function photoCredit(p: Pick<Photo, "license" | "author">) {
  const author = p.author.trim();
  switch (p.license) {
    case "own":
      return author ? `Foto: ${author}` : "Foto propia";
    case "press":
      return `Foto: ${author}`;
    case "cc-by":
      return `Foto: ${author} (CC BY)`;
    case "cc-by-sa":
      return `Foto: ${author} (CC BY-SA)`;
    case "cc0":
      return author ? `Foto: ${author} (dominio público)` : "Foto: dominio público";
    case "unsplash":
      return `Foto: ${author} / Unsplash`;
    case "pixabay":
      return `Foto: ${author} / Pixabay`;
    case "pexels":
      return `Foto: ${author} / Pexels`;
  }
}

/** Comprueba que el crédito está completo según el origen. Devuelve el error o null. */
export function creditError(license: string, author: string): string | null {
  if (!(license in PHOTO_LICENSES)) return "Indica de dónde sale la foto.";
  if (PHOTO_LICENSES[license as PhotoLicense].needsAuthor && !author.trim()) {
    return "Esta foto exige indicar quién la hizo o quién te la ha cedido.";
  }
  return null;
}

