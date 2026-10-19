"use client";

import Image from "next/image";
import type { ImageRef } from "@/lib/types";

/**
 * Imagen editorial con next/image: tamaños responsive, carga diferida, recorte
 * con object-fit y punto focal. Las imágenes enlazadas desde el origen de un
 * proveedor (p. ej. tiendas) se sirven tal cual, como exigen sus condiciones.
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
  // Nuestro almacenamiento (Supabase) pasa por el optimizador; el resto de orígenes externos se sirven tal cual.
  const optimizable = !host || host === process.env.NEXT_PUBLIC_IMAGE_HOST;
  return (
    <Image
      src={image.src}
      alt={alt ?? image.alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!optimizable}
      style={position ? { objectPosition: position } : undefined}
      className={`${fit === "cover" ? "object-cover" : "object-contain"} ${className}`}
    />
  );
}
