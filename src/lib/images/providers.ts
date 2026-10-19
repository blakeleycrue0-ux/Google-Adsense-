import "server-only";
import { isUsable, LICENSES, licenseFromText } from "./licenses";
import type { ImageCandidate, ImageProviderId } from "@/lib/types";

/**
 * Proveedores de fotografías con licencias compatibles:
 * - Openverse (principal, sin clave): agrega Wikimedia Commons, Flickr y otros
 *   repositorios con licencias abiertas. Solo se piden licencias que permiten
 *   uso comercial y modificación.
 * - Pexels (opcional, con clave).
 * Las claves se leen solo en el servidor; nunca llegan al navegador.
 */

export interface ProviderInfo {
  id: ImageProviderId;
  name: string;
  configured: boolean;
  needs?: string;
  docs: string;
  notes: string;
}

const env = (k: string) => process.env[k]?.trim() || "";

export function providerInfo(): ProviderInfo[] {
  return [
    {
      id: "openverse",
      name: "Openverse",
      configured: true,
      needs: env("OPENVERSE_CLIENT_ID") ? undefined : "OPENVERSE_CLIENT_ID y OPENVERSE_CLIENT_SECRET (opcional, más cuota)",
      docs: "https://api.openverse.org/v1/",
      notes: "Sin clave. Fotografías de Wikimedia Commons, Flickr y otros repositorios con licencia que permite uso comercial.",
    },
    {
      id: "pexels",
      name: "Pexels",
      configured: Boolean(env("PEXELS_API_KEY")),
      needs: "PEXELS_API_KEY",
      docs: "https://www.pexels.com/api/",
      notes: "Opcional. Fotografía genérica de calidad para noticias; se muestra autoría y enlace a Pexels.",
    },
  ];
}

export function userAgent() {
  const site = env("NEXT_PUBLIC_SITE_URL") || env("URL") || "http://localhost:3000";
  return `VoltioImageBot/1.0 (+${site})`;
}

export class ProviderError extends Error {}

/** Tiempo máximo de espera de cada proveedor. */
export const PROVIDER_TIMEOUT_MS = 10_000;

async function getJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "User-Agent": userAgent(), Accept: "application/json", ...init.headers },
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
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
  if (res.status === 429) throw new ProviderError("Límite de uso alcanzado (HTTP 429). Configura las credenciales de Openverse o espera unos minutos.");
  if (!res.ok) throw new ProviderError(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

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

const SOURCE_NAMES: Record<string, string> = { wikimedia: "Wikimedia Commons", flickr: "Flickr" };

export function parseOpenverse(data: OpenverseResponse): ImageCandidate[] {
  return (data.results ?? []).map((r) => {
    const { code, name } = licenseFromText(r.license, r.license_version);
    const source = r.source ? (SOURCE_NAMES[r.source] ?? r.source) : undefined;
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
      permissionNote: source ? `Publicada en ${source}` : undefined,
    });
  });
}

/** Token de aplicación de Openverse (opcional): amplía la cuota de búsquedas. */
let ovToken: { value: string; expires: number } | null = null;

async function openverseToken(): Promise<string | null> {
  const id = env("OPENVERSE_CLIENT_ID");
  const secret = env("OPENVERSE_CLIENT_SECRET");
  if (!id || !secret) return null;
  if (ovToken && ovToken.expires > Date.now() + 60_000) return ovToken.value;
  const res = await fetch("https://api.openverse.org/v1/auth_tokens/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": userAgent() },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secret }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!res?.ok) return null; // Se continúa de forma anónima.
  const data = (await res.json()) as { access_token: string; expires_in: number };
  ovToken = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 };
  return ovToken.value;
}

async function searchOpenverse(query: string, perPage: number, kind: "cover" | "phone") {
  const params = new URLSearchParams({
    q: query,
    page_size: String(perPage),
    license_type: "commercial,modification",
    category: "photograph",
    mature: "false",
  });
  if (kind === "cover") {
    // La resolución mínima se comprueba después (qualityScore); filtrar aquí por tamaño deja casi sin resultados.
    params.set("aspect_ratio", "wide");
  }
  const token = await openverseToken();
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

async function searchPexels(query: string, perPage: number, kind: "cover" | "phone") {
  const key = env("PEXELS_API_KEY");
  if (!key) throw new ProviderError("No configurado: falta PEXELS_API_KEY");
  const params = new URLSearchParams({ query, per_page: String(perPage), orientation: kind === "cover" ? "landscape" : "portrait" });
  return parsePexels(await getJson<PexelsResponse>(`https://api.pexels.com/v1/search?${params}`, { headers: { Authorization: key } }));
}

export async function searchProvider(
  id: ImageProviderId,
  query: string,
  opts: { perPage?: number; kind?: "cover" | "phone" } = {},
): Promise<ImageCandidate[]> {
  const perPage = opts.perPage ?? 20;
  const kind = opts.kind ?? "cover";
  switch (id) {
    case "openverse":
      return searchOpenverse(query, perPage, kind);
    case "pexels":
      return searchPexels(query, perPage, kind);
    default:
      throw new ProviderError("Proveedor sin búsqueda");
  }
}
