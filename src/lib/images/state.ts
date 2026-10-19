import type { ImageCandidate, ImageRef, ImageSearch, ImageTargetType } from "@/lib/types";

/** Umbral mínimo de puntuación para proponer una imagen automáticamente. */
const AUTO_THRESHOLD: Record<"cover" | "phone", number> = { cover: 50, phone: 60 };

export type ImageState = "approved" | "proposed" | "pending";

export const searchId = (type: ImageTargetType, id: string) => `${type}:${id}`;

/** Estado de la imagen de un contenido: aprobada, con propuesta o pendiente. */
export function imageState(ref: ImageRef | undefined, search?: ImageSearch | null): ImageState {
  if (ref?.src && (ref.meta?.status === "approved" || (!ref.meta && !ref.illustrative))) return "approved";
  if (search && bestCandidate(search)) return "proposed";
  return "pending";
}

export function bestCandidate(search: ImageSearch): ImageCandidate | null {
  const kind = search.targetType === "phone" ? "phone" : "cover";
  return search.candidates.find((c) => c.usable && c.matched && c.score >= AUTO_THRESHOLD[kind]) ?? null;
}

