import "server-only";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { applyImage, importCandidate } from "./import";
import type { DetectedItem, ImageCandidate, ImageProviderId, ImageSearch, ImageTargetType, Phone, Post } from "@/lib/types";
import { AUTO_APPROVER, keywordsFor, publishable, queryFor, scoreCandidate, type ScoreTarget } from "./scoring";
import { PROVIDER_TIMEOUT_MS, ProviderError, providerInfo, searchProvider } from "./providers";

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

/** Destino de puntuación equivalente (las noticias detectadas se tratan como artículos). */
function scoreTarget(t: Target): ScoreTarget {
  if (t.type === "phone") return { type: "phone", phone: t.phone };
  return { type: "post", post: t.type === "post" ? t.post : { title: t.detected.title, tags: t.detected.matchedKeywords } };
}

/** Consulta propuesta por defecto para cada tipo de contenido. */
export function defaultQuery(t: Target): string {
  return queryFor(scoreTarget(t));
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
  return c.provider === "feed" ? c : scoreCandidate(c, scoreTarget(t), keywords);
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
  const keywords = keywordsFor(scoreTarget(target), query);
  const kind = type === "phone" ? "phone" : "cover";

  const settled = await Promise.allSettled(providers.map((p) => searchProvider(p, query, { kind, perPage: 20 })));
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

export { AUTO_APPROVER };

/**
 * Publica sola la mejor candidata de una búsqueda si cumple todos los
 * controles: licencia comercial verificada, coincidencia con el contenido
 * (modelo exacto en móviles) y resolución suficiente. Las noticias detectadas
 * no se publican: su imagen pasa al borrador cuando se crea.
 */
async function autoPublish(s: ImageSearch): Promise<boolean> {
  if (s.targetType === "detected") return false;
  const target = await loadTarget(s.targetType, s.targetId);
  if (!target || target.type === "detected") return false;
  const current = target.type === "post" ? target.post.cover : target.phone.image;
  if (imageState(current) === "approved") return false;
  const kind = s.targetType === "phone" ? "phone" : "cover";
  const alt = target.type === "phone" ? `${target.phone.brand} ${target.phone.model}` : target.post.title;
  const eligible = publishable(s.candidates, kind).slice(0, 2);
  for (const c of eligible) {
    try {
      const ref = await importCandidate(c, kind, alt.slice(0, 160), AUTO_APPROVER);
      await applyImage(s.targetType, s.targetId, ref);
      return true;
    } catch (e) {
      // Descarga demasiado grande o formato no válido: se prueba la siguiente.
      console.warn(`[voltio-propuestas] ${s.id}: no se pudo importar ${c.key}: ${(e as Error).message}`);
      await db().increment("auto:importacion-fallida").catch(() => undefined);
    }
  }
  return false;
}

/**
 * Búsqueda y publicación automáticas: busca imágenes para noticias detectadas,
 * artículos y fichas sin imagen aprobada y publica la mejor si supera todos los
 * controles (ver autoPublish). Lo demás queda como propuesta en el panel.
 * Solo empieza un contenido si puede terminar dentro de `budgetMs` (las
 * funciones de Netlify se cortan a los 30 s); lo pendiente se retoma en la
 * siguiente ejecución.
 */
export async function autoPropose(limit = 8, { budgetMs = 24_000 }: { budgetMs?: number } = {}) {
  // Peor caso de un contenido: el tiempo de espera de los proveedores más la importación.
  const started = Date.now();
  const deadline = started + budgetMs - (PROVIDER_TIMEOUT_MS + 4_000);
  // Líneas cortas en los registros del servidor para saber dónde se va el tiempo.
  const trace = (msg: string) => console.warn(`[voltio-propuestas] +${Date.now() - started}ms ${msg}`);
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
  // Sin imagen aprobada: los ya buscados hace poco reutilizan su búsqueda (solo se intenta publicar).
  const unapproved: [ImageTargetType, string][] = [
    ...detected.filter((d) => d.status === "new" && !d.duplicateOf).map((d) => ["detected", d.id] as [ImageTargetType, string]),
    ...posts.filter((p) => imageState(p.cover) !== "approved").map((p) => ["post", p.id] as [ImageTargetType, string]),
    ...phones.filter((p) => imageState(p.image) !== "approved").map((p) => ["phone", p.id] as [ImageTargetType, string]),
  ];
  const reuse = unapproved.filter(([t, id]) => t !== "detected" && recent(searchId(t, id)));
  const queue = unapproved.filter(([t, id]) => !recent(searchId(t, id))).slice(0, limit);
  trace(`datos leídos (${posts.length} artículos, ${phones.length} móviles, ${detected.length} detectadas, ${searches.length} búsquedas) · reutilizables ${reuse.length} · cola ${queue.length}`);

  const summary = { searched: 0, proposed: 0, published: 0, pending: 0, errors: [] as string[] };
  const work: [ImageTargetType, string, boolean][] = [...reuse.map(([t, id]) => [t, id, true] as [ImageTargetType, string, boolean]), ...queue.map(([t, id]) => [t, id, false] as [ImageTargetType, string, boolean])];
  for (const [i, [type, id, reused]] of work.entries()) {
    if (Date.now() > deadline) {
      summary.pending = work.length - i;
      break;
    }
    const s = reused ? searched.get(searchId(type, id))! : await searchImages(type, id, { origin: "auto" });
    if (!s) continue;
    if (!reused) summary.searched++;
    if (bestCandidate(s)) summary.proposed++;
    const published = await autoPublish(s);
    if (published) summary.published++;
    trace(`${type}:${id} ${reused ? "búsqueda previa" : `${s.candidates.length} candidatas`} · ${published ? "publicada" : "sin publicar"}`);
    for (const e of s.errors) if (!summary.errors.includes(`${e.provider}: ${e.message}`)) summary.errors.push(`${e.provider}: ${e.message}`);
  }
  if (summary.published) revalidatePath("/", "layout");
  // Totales acumulados (se consultan al empezar la siguiente ejecución y en el diagnóstico).
  await Promise.all([
    summary.searched && db().increment("auto:buscadas", summary.searched),
    summary.published && db().increment("auto:publicadas", summary.published),
    summary.errors.length && db().increment("auto:errores-proveedor", summary.errors.length),
  ]).catch(() => undefined);
  return summary;
}

/** Copia la búsqueda de una noticia detectada al borrador creado a partir de ella. */
export async function carrySearch(fromDetectedId: string, toPostId: string) {
  const s = await getSearch("detected", fromDetectedId);
  if (!s) return;
  await db().put("imageSearches", { ...s, id: searchId("post", toPostId), targetType: "post", targetId: toPostId });
}
