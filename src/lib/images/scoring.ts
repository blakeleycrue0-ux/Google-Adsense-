import type { ImageCandidate, Phone, Post } from "@/lib/types";
import { LICENSES } from "./licenses";
import { matchPhone, matchTopic, postKeywords, qualityScore } from "./matching";

/**
 * Puntuación de candidatas, sin dependencias del servidor: la usan la búsqueda
 * del panel y el script que busca fotos durante la compilación.
 */

export type ScoreTarget =
  | { type: "phone"; phone: Pick<Phone, "brand" | "model" | "colors"> }
  | { type: "post"; post: Pick<Post, "title" | "tags"> };

/** Puntuación mínima para publicar sin revisión (coincidencia con el tema y encuadre horizontal en portadas; modelo exacto en móviles). */
export const AUTO_PUBLISH_MIN: Record<"cover" | "phone", number> = { cover: 60, phone: 60 };

/** Quién figura como aprobador de las imágenes publicadas automáticamente. */
export const AUTO_APPROVER = "Automático (Voltio)";

export function queryFor(t: ScoreTarget): string {
  if (t.type === "phone") {
    const { brand, model } = t.phone;
    return model.toLowerCase().startsWith(brand.toLowerCase()) ? model : `${brand} ${model}`;
  }
  const { en, es } = postKeywords(t.post);
  return (en.length >= 2 ? en : [...en, ...es]).slice(0, 4).join(" ");
}

export function keywordsFor(t: ScoreTarget, query: string): string[] {
  if (t.type === "phone") return [];
  const { en, es } = postKeywords(t.post);
  return [...new Set([...en, ...es, ...query.toLowerCase().split(/\s+/).filter((w) => w.length > 2)])];
}

/** Coincidencia con el contenido, licencia y calidad de una candidata. */
export function scoreCandidate(c: ImageCandidate, t: ScoreTarget, keywords: string[]): ImageCandidate {
  const text = `${c.title} ${c.description ?? ""}`;
  const kind = t.type === "phone" ? "phone" : "cover";
  const match = t.type === "phone" ? matchPhone(t.phone, text) : matchTopic(keywords, text);
  const quality = qualityScore(c.width, c.height, kind);
  const reasons = [...match.reasons, ...quality.reasons];
  let usable = c.usable;
  let blockedReason = c.blockedReason;
  if (!quality.ok && usable) {
    usable = false;
    blockedReason = quality.reasons[0];
  }
  const attributionPenalty = LICENSES[c.license].attribution ? 0 : 3;
  return {
    ...c,
    usable,
    blockedReason,
    matched: match.ok,
    score: match.ok ? match.score + quality.score + attributionPenalty : 0,
    reasons,
  };
}

/** Candidatas que se pueden publicar sin revisión, de mejor a peor. */
export function publishable(candidates: ImageCandidate[], kind: "cover" | "phone"): ImageCandidate[] {
  return candidates
    .filter((c) => c.usable && c.matched && c.score >= AUTO_PUBLISH_MIN[kind])
    .sort((a, b) => b.score - a.score);
}
