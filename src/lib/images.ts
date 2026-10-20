import "server-only";
import sharp from "sharp";
import { db, newId } from "@/lib/db";
import { slugify } from "@/lib/format";

const MAX_BYTES = 12 * 1024 * 1024;
const MAX_PIXELS = 80_000_000;
const MIN_WIDTH = 600;

/**
 * Optimiza la foto (WebP, máx. 1600 px de ancho) y la guarda. sharp elimina los
 * metadatos EXIF, incluida la ubicación GPS de las fotos hechas con el móvil.
 */
export async function storePhoto(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("El archivo no es una imagen.");
  if (file.size > MAX_BYTES) throw new Error("La foto pesa demasiado (máximo 12 MB).");
  const input = Buffer.from(await file.arrayBuffer());
  const meta = await sharp(input, { limitInputPixels: MAX_PIXELS })
    .metadata()
    .catch(() => null);
  if (!meta?.width || !meta.height) throw new Error("No se ha podido leer la imagen. Prueba con un JPG o PNG.");
  const rotated = (meta.orientation ?? 1) >= 5;
  const width = rotated ? meta.height : meta.width;
  if (width < MIN_WIDTH) throw new Error(`La foto es demasiado pequeña (${width} px de ancho; mínimo ${MIN_WIDTH}).`);

  const { data, info } = await sharp(input, { limitInputPixels: MAX_PIXELS })
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  const now = new Date();
  const base = slugify(file.name.replace(/\.[^.]+$/, "")).slice(0, 50) || "foto";
  const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${base}-${newId().slice(0, 6)}.webp`;
  const url = await db().uploadFile(path, data, "image/webp");
  return { url, path, width: info.width, height: info.height };
}
