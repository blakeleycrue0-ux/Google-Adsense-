"use client";

import Image, { type ImageLoader } from "next/image";
import type { ImageRef } from "@/lib/types";

/** Unsplash exige servir sus fotos desde su CDN: se piden tamaños con sus parámetros. */
const unsplashLoader: ImageLoader = ({ src, width, quality }) => {
  const u = new URL(src);
  u.searchParams.set("w", String(width));
  u.searchParams.set("q", String(quality ?? 75));
  u.searchParams.set("auto", "format");
  u.searchParams.set("fit", "max");
  return u.toString();
};

/**
 * Imagen editorial con next/image: tamaños responsive, carga diferida, recorte
 * con object-fit y punto focal. Las imágenes enlazadas desde el CDN de un
 * proveedor (Unsplash, tiendas) se sirven desde su origen, como exigen sus condiciones.
 */
export function Photo({
  image,
  sizes,
  priority,
  fit = "cover",
  className = "",
  alt,
}: {
  image: ImageRef;
  sizes: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  className?: string;
  alt?: string;
}) {
  if (!image.src) return null;
  const position = image.meta?.focalX != null ? `${image.meta.focalX}% ${image.meta.focalY ?? 50}%` : undefined;
  const host = /^https?:\/\//.test(image.src) ? new URL(image.src).hostname : null;
  const isUnsplash = host === "images.unsplash.com";
  // Nuestro almacenamiento (Supabase) pasa por el optimizador; el resto de orígenes externos se sirven tal cual.
  const optimizable = !host || host === process.env.NEXT_PUBLIC_IMAGE_HOST;
  return (
    <Image
      src={image.src}
      alt={alt ?? image.alt}
      fill
      sizes={sizes}
      priority={priority}
      loader={isUnsplash ? unsplashLoader : undefined}
      unoptimized={!optimizable && !isUnsplash}
      style={position ? { objectPosition: position } : undefined}
      className={`${fit === "cover" ? "object-cover" : "object-contain"} ${className}`}
    />
  );
}
