import "server-only";
import { db } from "@/lib/db";
import type { DetectedItem, ImageCandidate, ImageProviderId, ImageSearch, ImageTargetType, Phone, Post } from "@/lib/types";
import { LICENSES } from "./licenses";
import { matchPhone, matchTopic, postKeywords, qualityScore } from "./matching";
import { ProviderError, providerInfo, searchProvider } from "./providers";

export { bestCandidate, imageState, searchId, type ImageState } from "./state";
import { bestCandidate, imageState, searchId } from "./state";

type Target =
  | { type: "post"; post: Post; detected?: DetectedItem | null }
  | { type: "phone"; phone: Phone }
  | { type: "detected"; detected: DetectedItem };

export async function loadTarget(type: ImageTargetType, id: string): Promise<Target | null> {
  if (type === "post") {
    const post = await db().get("posts", id);
    if (!post) return null;
    const detected = post.detectedItemId ? await db().get("detected", post.detectedItemId) : null;
    return { type, post, detected };
  }
  if (type === "phone") {
    const phone = await db().get("phones", id);
    return phone ? { type, phone } : null;
  }
  const detected = await db().get("detected", id);
  return detected ? { type, detected } : null;
}

/** Consulta propuesta por defecto para cada tipo de contenido. */
export function defaultQuery(t: Target): string {
  if (t.type === "phone") return `${t.phone.brand} ${t.phone.model}`;
  const source = t.type === "post" ? t.post : { title: t.detected.title, tags: t.detected.matchedKeywords };
  const { en, es } = postKeywords(source);
  return (en.length >= 2 ? en : [...en, ...es]).slice(0, 4).join(" ");
}

function keywordsFor(t: Target, query: string) {
  if (t.type === "phone") return [];
  const source = t.type === "post" ? t.post : { title: t.detected.title, tags: t.detected.matchedKeywords };
  const { en, es } = postKeywords(source);
  return [...new Set([...en, ...es, ...query.toLowerCase().split(/\s+/).filter((w) => w.length > 2)])];
}

/** Candidata con la imagen que la propia fuente incluye en su feed. */
async function feedCandidate(detected: DetectedItem | null | undefined): Promise<ImageCandidate | null> {
  if (!detected?.feedImage?.url) return null;
  const source = await db().get("sources", detected.sourceId);
  const allowed = Boolean(source?.imagesReusable);
  return {
    key: `feed:${detected.id}`,
    provider: "feed",
    externalId: detected.id,
    title: `Imagen del feed de ${detected.sourceName}`,
    description: detected.title,
    previewUrl: detected.feedImage.url,
    fullUrl: detected.feedImage.url,
    width: 0,
    height: 0,
    license: allowed ? "press" : "unknown",
    licenseName: allowed ? "Permiso de la fuente" : "Sin permiso de reutilización",
    author: detected.feedImage.credit || detected.feedImage.copyright || detected.sourceName,
    sourceUrl: detected.url,
    permissionNote: allowed ? source?.imagePermissionNote : undefined,
    usable: allowed,
    blockedReason: allowed
      ? undefined
      : `${detected.sourceName} no ha autorizado la reutilización de sus imágenes. No se copian fotografías de otros medios.`,
    matched: true,
    score: allowed ? 70 : 0,
    reasons: allowed ? ["Imagen original de la noticia, con permiso de la fuente"] : [],
  };
}

function score(c: ImageCandidate, t: Target, keywords: string[]): ImageCandidate {
  if (c.provider === "feed") return c;
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

/**
 * Busca imágenes para un contenido en todos los proveedores configurados,
 * puntúa cada candidata (coincidencia, licencia, calidad) y guarda el resultado.
 */
export async function searchImages(
  type: ImageTargetType,
  id: string,
  opts: { query?: string; providers?: ImageProviderId[]; origin?: "auto" | "manual" } = {},
): Promise<ImageSearch | null> {
  const target = await loadTarget(type, id);
  if (!target) return null;
  const query = (opts.query?.trim() || defaultQuery(target)).slice(0, 120);
  const configured = providerInfo().filter((p) => p.configured).map((p) => p.id);
  const providers = (opts.providers?.length ? opts.providers : configured).filter((p) => configured.includes(p));
  const keywords = keywordsFor(target, query);
  const orientation = type === "phone" ? "portrait" : "landscape";

  const settled = await Promise.allSettled(providers.map((p) => searchProvider(p, query, { orientation, perPage: 15 })));
  const errors: ImageSearch["errors"] = [];
  const candidates: ImageCandidate[] = [];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") candidates.push(...r.value);
    else errors.push({ provider: providers[i], message: r.reason instanceof ProviderError ? r.reason.message : "Error inesperado" });
  });

  const detected = target.type === "post" ? target.detected : target.type === "detected" ? target.detected : null;
  const feed = await feedCandidate(detected);

  const scored = [...(feed ? [feed] : []), ...candidates.map((c) => score(c, target, keywords))].sort(
    (a, b) => Number(b.usable && b.matched) - Number(a.usable && a.matched) || b.score - a.score,
  );

  const record: ImageSearch = {
    id: searchId(type, id),
    targetType: type,
    targetId: id,
    query,
    createdAt: new Date().toISOString(),
    candidates: scored.slice(0, 60),
    errors,
    origin: opts.origin ?? "manual",
  };
  await db().put("imageSearches", record);
  return record;
}

export async function getSearch(type: ImageTargetType, id: string) {
  return db().get("imageSearches", searchId(type, id));
}

/**
 * Propuestas automáticas: busca imágenes para noticias detectadas, artículos y
 * fichas que aún no tienen imagen aprobada. Nunca aprueba ni publica nada.
 */
export async function autoPropose(limit = 8) {
  const [posts, phones, detected, searches] = await Promise.all([
    db().list("posts"),
    db().list("phones"),
    db().list("detected"),
    db().list("imageSearches"),
  ]);
  const searched = new Map(searches.map((s) => [s.id, s]));
  const recent = (key: string) => {
    const s = searched.get(key);
    return s && Date.now() - new Date(s.createdAt).getTime() < 24 * 3600_000;
  };
  const queue: [ImageTargetType, string][] = [
    ...detected.filter((d) => d.status === "new" && !d.duplicateOf && !recent(searchId("detected", d.id))).map((d) => ["detected", d.id] as [ImageTargetType, string]),
    ...posts.filter((p) => imageState(p.cover) !== "approved" && !recent(searchId("post", p.id))).map((p) => ["post", p.id] as [ImageTargetType, string]),
    ...phones.filter((p) => imageState(p.image) !== "approved" && !recent(searchId("phone", p.id))).map((p) => ["phone", p.id] as [ImageTargetType, string]),
  ].slice(0, limit);

  const summary = { searched: 0, proposed: 0, errors: [] as string[] };
  for (const [type, id] of queue) {
    const s = await searchImages(type, id, { origin: "auto" });
    if (!s) continue;
    summary.searched++;
    if (bestCandidate(s)) summary.proposed++;
    for (const e of s.errors) if (!summary.errors.includes(`${e.provider}: ${e.message}`)) summary.errors.push(`${e.provider}: ${e.message}`);
  }
  return summary;
}

/** Copia la búsqueda de una noticia detectada al borrador creado a partir de ella. */
export async function carrySearch(fromDetectedId: string, toPostId: string) {
  const s = await getSearch("detected", fromDetectedId);
  if (!s) return;
  await db().put("imageSearches", { ...s, id: searchId("post", toPostId), targetType: "post", targetId: toPostId });
}
