import "server-only";
import { isUsable, LICENSES, licenseFromText } from "./licenses";
import type { ImageCandidate, ImageProviderId } from "@/lib/types";

/**
 * Proveedores de imágenes con licencias compatibles. Cada uno devuelve
 * candidatas con su licencia, autoría y página de origen. Ninguno se usa
 * si no está configurado; los errores (sin clave, red bloqueada, límite de
 * uso) se devuelven tal cual para mostrarlos en el panel.
 */

export interface ProviderInfo {
  id: ImageProviderId;
  name: string;
  configured: boolean;
  needs?: string;
  docs: string;
  notes: string;
}

export function providerInfo(): ProviderInfo[] {
  return [
    {
      id: "wikimedia",
      name: "Wikimedia Commons",
      configured: true,
      docs: "https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia",
      notes: "Sin clave. Solo licencias libres; exige atribución en CC BY/BY-SA.",
    },
    {
      id: "openverse",
      name: "Openverse",
      configured: true,
      needs: "OPENVERSE_TOKEN (opcional, más cuota)",
      docs: "https://api.openverse.org/v1/",
      notes: "Sin clave. Se filtran licencias que permiten uso comercial y modificación.",
    },
    {
      id: "pexels",
      name: "Pexels",
      configured: Boolean(process.env.PEXELS_API_KEY),
      needs: "PEXELS_API_KEY",
      docs: "https://www.pexels.com/api/",
      notes: "Fotografías genéricas de calidad. Se muestra autoría y enlace a Pexels.",
    },
    {
      id: "unsplash",
      name: "Unsplash",
      configured: Boolean(process.env.UNSPLASH_ACCESS_KEY),
      needs: "UNSPLASH_ACCESS_KEY",
      docs: "https://unsplash.com/documentation",
      notes: "Las imágenes se sirven desde su CDN (obligatorio) y se notifica cada descarga.",
    },
  ];
}

export function userAgent() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const contact = process.env.IMAGE_CONTACT_EMAIL || "sin-contacto";
  return `VoltioImageBot/1.0 (${site}; ${contact})`;
}

export class ProviderError extends Error {}

async function getJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "User-Agent": userAgent(), Accept: "application/json", ...init.headers },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
  } catch (e) {
    const cause = (e as Error & { cause?: { code?: string } }).cause?.code;
    throw new ProviderError(
      (e as Error).name === "TimeoutError"
        ? "Tiempo de espera agotado"
        : `Sin conexión con el servicio${cause ? ` (${cause})` : ""}: comprueba la red o el cortafuegos`,
    );
  }
  if (res.status === 401 || res.status === 403) throw new ProviderError(`Acceso denegado (HTTP ${res.status}): revisa la clave o la red`);
  if (res.status === 429) throw new ProviderError("Límite de uso alcanzado (HTTP 429)");
  if (!res.ok) throw new ProviderError(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

const stripHtml = (s?: string) =>
  (s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

type Raw = Omit<ImageCandidate, "key" | "score" | "reasons" | "usable" | "blockedReason">;

function finalize(raw: Raw): ImageCandidate {
  const usable = isUsable(raw.license);
  return {
    ...raw,
    key: `${raw.provider}:${raw.externalId}`,
    usable,
    blockedReason: usable ? undefined : LICENSES[raw.license].reason,
    score: 0,
    reasons: [],
  };
}

// ── Wikimedia Commons ─────────────────────────────────────────

interface CommonsResponse {
  query?: {
    pages?: Record<
      string,
      {
        pageid: number;
        title: string;
        imageinfo?: {
          url: string;
          thumburl?: string;
          width: number;
          height: number;
          mime: string;
          descriptionurl: string;
          extmetadata?: Record<string, { value?: string }>;
        }[];
      }
    >;
  };
}

export function parseCommons(data: CommonsResponse): ImageCandidate[] {
  const pages = Object.values(data.query?.pages ?? {});
  return pages.flatMap((p) => {
    const info = p.imageinfo?.[0];
    if (!info || !/^image\/(jpeg|png|webp)$/.test(info.mime)) return [];
    const md = info.extmetadata ?? {};
    const v = (k: string) => md[k]?.value;
    const { code, name } = licenseFromText(v("LicenseShortName") ?? v("License"));
    const author = stripHtml(v("Artist")) || stripHtml(v("Credit")) || undefined;
    const title = p.title.replace(/^File:/, "").replace(/\.[a-z0-9]+$/i, "").replace(/_/g, " ");
    return [
      finalize({
        provider: "wikimedia",
        externalId: String(p.pageid),
        title,
        description: stripHtml(v("ImageDescription")).slice(0, 400) || undefined,
        previewUrl: info.thumburl ?? info.url,
        fullUrl: info.url,
        width: info.width,
        height: info.height,
        license: code,
        licenseName: name,
        licenseUrl: v("LicenseUrl"),
        author: author?.slice(0, 160),
        sourceUrl: info.descriptionurl,
        permissionNote: v("Restrictions") ? `Restricciones adicionales: ${stripHtml(v("Restrictions"))}` : undefined,
      }),
    ];
  });
}

async function searchCommons(query: string, perPage: number) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrnamespace: "6",
    gsrsearch: `${query} filetype:bitmap`,
    gsrlimit: String(perPage),
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "640",
    origin: "*",
  });
  return parseCommons(await getJson<CommonsResponse>(`https://commons.wikimedia.org/w/api.php?${params}`));
}

// ── Openverse ─────────────────────────────────────────────────

interface OpenverseResponse {
  results?: {
    id: string;
    title?: string;
    url: string;
    thumbnail?: string;
    creator?: string;
    creator_url?: string;
    license: string;
    license_version?: string;
    license_url?: string;
    foreign_landing_url: string;
    width?: number | null;
    height?: number | null;
    source?: string;
    tags?: { name: string }[];
  }[];
}

export function parseOpenverse(data: OpenverseResponse): ImageCandidate[] {
  return (data.results ?? []).map((r) => {
    const { code, name } = licenseFromText(r.license, r.license_version);
    return finalize({
      provider: "openverse",
      externalId: r.id,
      title: r.title || "Sin título",
      description: r.tags?.map((t) => t.name).join(", "),
      previewUrl: r.thumbnail || r.url,
      fullUrl: r.url,
      width: r.width ?? 0,
      height: r.height ?? 0,
      license: code,
      licenseName: name,
      licenseUrl: r.license_url,
      author: r.creator,
      authorUrl: r.creator_url,
      sourceUrl: r.foreign_landing_url,
      permissionNote: r.source ? `Origen: ${r.source}` : undefined,
    });
  });
}

async function searchOpenverse(query: string, perPage: number) {
  const params = new URLSearchParams({ q: query, page_size: String(perPage), license_type: "commercial,modification", mature: "false" });
  const token = process.env.OPENVERSE_TOKEN;
  return parseOpenverse(
    await getJson<OpenverseResponse>(`https://api.openverse.org/v1/images/?${params}`, token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  );
}

// ── Pexels ────────────────────────────────────────────────────

interface PexelsResponse {
  photos?: {
    id: number;
    width: number;
    height: number;
    url: string;
    photographer: string;
    photographer_url: string;
    alt?: string;
    src: { original: string; large2x: string; large: string; medium: string };
  }[];
}

export function parsePexels(data: PexelsResponse): ImageCandidate[] {
  return (data.photos ?? []).map((p) =>
    finalize({
      provider: "pexels",
      externalId: String(p.id),
      title: p.alt || "Fotografía de Pexels",
      description: p.alt,
      previewUrl: p.src.medium,
      fullUrl: p.src.original,
      width: p.width,
      height: p.height,
      license: "pexels",
      licenseName: LICENSES.pexels.name,
      licenseUrl: LICENSES.pexels.url,
      author: p.photographer,
      authorUrl: p.photographer_url,
      sourceUrl: p.url,
    }),
  );
}

async function searchPexels(query: string, perPage: number, orientation: "landscape" | "portrait") {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new ProviderError("No configurado: falta PEXELS_API_KEY");
  const params = new URLSearchParams({ query, per_page: String(perPage), orientation });
  return parsePexels(await getJson<PexelsResponse>(`https://api.pexels.com/v1/search?${params}`, { headers: { Authorization: key } }));
}

// ── Unsplash ──────────────────────────────────────────────────

interface UnsplashResponse {
  results?: {
    id: string;
    width: number;
    height: number;
    description?: string | null;
    alt_description?: string | null;
    urls: { raw: string; small: string; regular: string };
    links: { html: string; download_location: string };
    user: { name: string; links: { html: string } };
  }[];
}

export function parseUnsplash(data: UnsplashResponse): ImageCandidate[] {
  const ref = "utm_source=voltio&utm_medium=referral";
  return (data.results ?? []).map((r) =>
    finalize({
      provider: "unsplash",
      externalId: r.id,
      title: r.alt_description || r.description || "Fotografía de Unsplash",
      description: r.description ?? undefined,
      previewUrl: r.urls.small,
      fullUrl: r.urls.raw,
      width: r.width,
      height: r.height,
      license: "unsplash",
      licenseName: LICENSES.unsplash.name,
      licenseUrl: LICENSES.unsplash.url,
      author: r.user.name,
      authorUrl: `${r.user.links.html}?${ref}`,
      sourceUrl: `${r.links.html}?${ref}`,
      hotlink: true,
      trackUrl: r.links.download_location,
    }),
  );
}

async function searchUnsplash(query: string, perPage: number, orientation: "landscape" | "portrait") {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) throw new ProviderError("No configurado: falta UNSPLASH_ACCESS_KEY");
  const params = new URLSearchParams({ query, per_page: String(perPage), orientation, content_filter: "high" });
  return parseUnsplash(
    await getJson<UnsplashResponse>(`https://api.unsplash.com/search/photos?${params}`, { headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" } }),
  );
}

/** Notifica a Unsplash el uso de una foto (requisito de sus condiciones de API). */
export async function trackUnsplashDownload(trackUrl: string) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || !trackUrl.startsWith("https://api.unsplash.com/")) return;
  await fetch(trackUrl, { headers: { Authorization: `Client-ID ${key}` }, signal: AbortSignal.timeout(8000) }).catch(() => undefined);
}

export async function searchProvider(
  id: ImageProviderId,
  query: string,
  opts: { perPage?: number; orientation?: "landscape" | "portrait" } = {},
): Promise<ImageCandidate[]> {
  const perPage = opts.perPage ?? 15;
  const orientation = opts.orientation ?? "landscape";
  switch (id) {
    case "wikimedia":
      return searchCommons(query, perPage);
    case "openverse":
      return searchOpenverse(query, perPage);
    case "pexels":
      return searchPexels(query, perPage, orientation);
    case "unsplash":
      return searchUnsplash(query, perPage, orientation);
    default:
      throw new ProviderError("Proveedor sin búsqueda");
  }
}
