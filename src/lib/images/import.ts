import "server-only";
import { lookup } from "node:dns/promises";
import net from "node:net";
import sharp from "sharp";
import { db, newId } from "@/lib/db";
import { slugify } from "@/lib/format";
import type { ImageCandidate, ImageMeta, ImageRef, ImageTargetType, LicenseCode, MediaItem } from "@/lib/types";
import { attributionText, isUsable, LICENSES } from "./licenses";
import { userAgent } from "./providers";

const MAX_DOWNLOAD = 25 * 1024 * 1024;
const MASTER_WIDTH = 2400;
export const MIN_WIDTH: Record<"cover" | "phone", number> = { cover: 1200, phone: 500 };

export class ImportError extends Error {}

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:127.") || v.startsWith("::ffff:10.");
}

/** En desarrollo se permite importar desde la propia máquina (pruebas locales). */
const allowPrivate = () => process.env.NODE_ENV === "development" || process.env.IMAGE_IMPORT_ALLOW_PRIVATE === "1";

async function assertPublicUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ImportError("URL de imagen no válida.");
  }
  if (url.protocol !== "https:" && !(allowPrivate() && url.protocol === "http:")) throw new ImportError("Solo se admiten URLs https.");
  if (allowPrivate()) return url;
  const addrs = await lookup(url.hostname, { all: true }).catch(() => []);
  if (!addrs.length) throw new ImportError("No se puede resolver el dominio de la imagen.");
  if (addrs.some((a) => isPrivateIp(a.address))) throw new ImportError("La URL apunta a una red privada.");
  return url;
}

/** Descarga con comprobación de destino en cada redirección, tipo y tamaño. */
async function safeDownload(raw: string): Promise<Buffer> {
  let current = raw;
  for (let i = 0; i < 4; i++) {
    const url = await assertPublicUrl(current);
    let res: Response;
    try {
      res = await fetch(url, { redirect: "manual", headers: { "User-Agent": userAgent(), Accept: "image/*" }, signal: AbortSignal.timeout(20_000), cache: "no-store" });
    } catch {
      throw new ImportError("No se ha podido descargar la imagen (sin conexión con el servidor de origen).");
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location")!, url).toString();
      continue;
    }
    if (!res.ok) throw new ImportError(`El servidor de la imagen respondió HTTP ${res.status}.`);
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) throw new ImportError("El enlace no es una imagen.");
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_DOWNLOAD) throw new ImportError("La imagen supera los 25 MB.");
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_DOWNLOAD) throw new ImportError("La imagen supera los 25 MB.");
    return buf;
  }
  throw new ImportError("Demasiadas redirecciones.");
}

/**
 * Optimiza y guarda la imagen maestra (WebP, máx. 2400 px). next/image genera
 * después los tamaños responsive para cada dispositivo.
 */
export async function storeImage(input: Buffer, name: string, kind: "cover" | "phone", meta: ImageMeta, alt: string): Promise<MediaItem> {
  const info = await sharp(input).metadata().catch(() => null);
  if (!info) throw new ImportError("El archivo no es una imagen válida.");
  const rotated = (info.orientation ?? 1) >= 5;
  const w = (rotated ? info.height : info.width) ?? 0;
  const h = (rotated ? info.width : info.height) ?? 0;
  if (Math.max(w, h) < MIN_WIDTH[kind] || (kind === "cover" && w < MIN_WIDTH.cover)) {
    throw new ImportError(`Resolución insuficiente (${w}×${h}). Mínimo ${MIN_WIDTH[kind]} px de ancho para ${kind === "cover" ? "portadas" : "fichas"}.`);
  }
  const { data, info: out } = await sharp(input)
    .rotate()
    .resize({ width: MASTER_WIDTH, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer({ resolveWithObject: true });
  const now = new Date();
  const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${slugify(name).slice(0, 60) || "imagen"}-${newId().slice(0, 6)}.webp`;
  const url = await db().uploadFile(path, data, "image/webp");
  const item: MediaItem = { id: newId("med_"), url, path, alt, width: out.width, height: out.height, size: data.length, mime: "image/webp", uploadedAt: now.toISOString(), meta };
  await db().put("media", item);
  return item;
}

export function metaFromCandidate(c: ImageCandidate, user: string): ImageMeta {
  return {
    status: "approved",
    provider: c.provider,
    license: c.license,
    licenseName: c.licenseName,
    licenseUrl: c.licenseUrl ?? LICENSES[c.license].url,
    author: c.author,
    authorUrl: c.authorUrl,
    sourceUrl: c.sourceUrl,
    title: c.title,
    permissionNote: c.permissionNote,
    attributionRequired: LICENSES[c.license].attribution,
    hotlinked: Boolean(c.hotlink),
    externalId: c.externalId,
    approvedAt: new Date().toISOString(),
    approvedBy: user,
  };
}

/** Importa una candidata: la copia y optimiza (o la enlaza si su licencia lo exige). */
export async function importCandidate(c: ImageCandidate, kind: "cover" | "phone", alt: string, user: string): Promise<ImageRef> {
  if (!c.usable || !isUsable(c.license)) throw new ImportError(c.blockedReason ?? "La licencia de esta imagen no permite usarla.");
  const meta = metaFromCandidate(c, user);
  if (c.hotlink) {
    if (c.width && c.width < MIN_WIDTH[kind] && kind === "cover") throw new ImportError("Resolución insuficiente para portada.");
    return { src: c.fullUrl, alt, width: c.width, height: c.height, credit: attributionText(meta), meta };
  }
  const buf = await safeDownload(c.fullUrl);
  const item = await storeImage(buf, c.title, kind, meta, alt);
  return { src: item.url, alt, width: item.width, height: item.height, credit: attributionText(meta), meta };
}

/** Imagen indicada manualmente por URL (prensa con permiso, tienda/afiliación). */
export async function importFromUrl(
  url: string,
  opts: { kind: "cover" | "phone"; alt: string; license: LicenseCode; author?: string; sourceUrl?: string; permissionNote?: string; hotlink?: boolean; user: string },
): Promise<ImageRef> {
  if (!isUsable(opts.license)) throw new ImportError(LICENSES[opts.license].reason ?? "Licencia no admitida.");
  if ((opts.license === "press" || opts.license === "retailer") && !opts.permissionNote?.trim()) {
    throw new ImportError("Describe el permiso o las condiciones que autorizan su uso.");
  }
  const meta: ImageMeta = {
    status: "approved",
    provider: opts.license === "retailer" ? "retailer" : opts.license === "press" ? "press" : "upload",
    license: opts.license,
    licenseName: LICENSES[opts.license].name,
    licenseUrl: LICENSES[opts.license].url,
    author: opts.author?.trim() || undefined,
    sourceUrl: opts.sourceUrl?.trim() || url,
    permissionNote: opts.permissionNote?.trim() || undefined,
    attributionRequired: LICENSES[opts.license].attribution,
    hotlinked: Boolean(opts.hotlink),
    approvedAt: new Date().toISOString(),
    approvedBy: opts.user,
  };
  if (opts.hotlink) {
    await assertPublicUrl(url);
    return { src: url, alt: opts.alt, credit: attributionText(meta), meta };
  }
  const buf = await safeDownload(url);
  const item = await storeImage(buf, opts.alt || "imagen", opts.kind, meta, opts.alt);
  return { src: item.url, alt: opts.alt, width: item.width, height: item.height, credit: attributionText(meta), meta };
}

/** Asigna la imagen aprobada al contenido. Conserva el resto de datos. */
export async function applyImage(type: ImageTargetType, id: string, ref: ImageRef) {
  if (type === "post") {
    const post = await db().get("posts", id);
    if (!post) throw new ImportError("Artículo no encontrado.");
    await db().put("posts", { ...post, cover: ref, updatedAt: new Date().toISOString() });
    return;
  }
  if (type === "phone") {
    const phone = await db().get("phones", id);
    if (!phone) throw new ImportError("Ficha no encontrada.");
    await db().put("phones", { ...phone, image: ref, updatedAt: new Date().toISOString() });
    return;
  }
  throw new ImportError("Selecciona la imagen al crear el borrador de la noticia.");
}
