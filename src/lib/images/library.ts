import "server-only";
import { db } from "@/lib/db";
import { catalogDevices, deviceKey, linkPhones, mergeCatalog } from "@/lib/devices";
import type { Device, DeviceSlot, ImageMeta, ImageRef } from "@/lib/types";
import { ImportError, safeDownload, storeImage } from "./import";
import { attributionText, isUsable, LICENSES, licenseFromText } from "./licenses";
import { userAgent } from "./providers";

/**
 * Operaciones de la biblioteca fija de móviles: importación del catálogo,
 * asignación de fotos por vista e importación verificable desde Wikimedia Commons.
 */

/**
 * Importa (o reimporta) el catálogo hasta la fase indicada. Idempotente: los
 * dispositivos existentes conservan sus fotos y las fichas solo ganan el enlace.
 */
export async function importCatalog(phase: 1 | 2) {
  const [devices, phones] = await Promise.all([db().list("devices"), db().list("phones")]);
  const { toWrite, created, updated, unchanged } = mergeCatalog(devices, catalogDevices(phase));
  for (const d of toWrite) await db().put("devices", d);
  const all = [...devices.filter((d) => !toWrite.some((w) => w.id === d.id)), ...toWrite];
  const linked = linkPhones(phones, all).filter((p, i) => p.deviceId !== phones[i].deviceId);
  for (const p of linked) await db().put("phones", p);
  return { created, updated, unchanged, linked: linked.length, total: all.length };
}

export async function getDevice(id: string) {
  return db().get("devices", id);
}

/** Guarda (o sustituye) la foto de una vista. La anterior sigue en Medios. */
export async function setDevicePhoto(deviceId: string, slot: DeviceSlot, ref: ImageRef | null) {
  const device = await db().get("devices", deviceId);
  if (!device) throw new ImportError("Dispositivo no encontrado.");
  const photos = { ...device.photos };
  if (ref) photos[slot] = ref;
  else delete photos[slot];
  const next: Device = { ...device, photos, updatedAt: new Date().toISOString() };
  await db().put("devices", next);
  return next;
}

/** Texto sin etiquetas HTML (Commons devuelve el autor con enlaces). */
const plain = (html: string | undefined) =>
  (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

const httpUrl = (u: string | undefined) => (u && /^https?:\/\//i.test(u) ? u : undefined);

export interface CommonsFile {
  title: string;
  pageUrl: string;
  fileUrl: string;
  width: number;
  height: number;
  mime: string;
  license: ReturnType<typeof licenseFromText>;
  licenseUrl?: string;
  author?: string;
  authorUrl?: string;
  description?: string;
  categories: string[];
}

/** Nombre del archivo a partir de la URL de su página en Commons («…/wiki/File:Nombre.jpg»). */
export function commonsTitle(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new ImportError("Pega la URL de la página del archivo en Wikimedia Commons.");
  }
  if (url.hostname !== "commons.wikimedia.org") throw new ImportError("La URL debe ser de commons.wikimedia.org.");
  const m = decodeURIComponent(url.pathname).match(/^\/wiki\/((?:File|Archivo):.+)$/);
  const title = m?.[1] ?? url.searchParams.get("title");
  if (!title || !/^(File|Archivo):/.test(title)) throw new ImportError("La URL no es la página de un archivo («/wiki/File:…»).");
  return title.replace(/^Archivo:/, "File:").replace(/_/g, " ");
}

/** Lee de la API de Commons la licencia, el autor, el tamaño y las categorías del archivo. */
export async function commonsLookup(raw: string): Promise<CommonsFile> {
  const title = commonsTitle(raw);
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    titles: title,
    prop: "imageinfo|categories",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "2400",
    cllimit: "50",
    clshow: "!hidden",
  });
  let res: Response;
  try {
    res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
      headers: { "User-Agent": userAgent(), Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
  } catch {
    throw new ImportError("Sin conexión con Wikimedia Commons desde este servidor.");
  }
  if (!res.ok) throw new ImportError(`Wikimedia Commons respondió HTTP ${res.status}.`);
  type Meta = Record<string, { value?: string } | undefined>;
  const data = (await res.json()) as {
    query?: { pages?: { missing?: boolean; title: string; imageinfo?: { url: string; thumburl?: string; descriptionurl: string; width: number; height: number; mime: string; extmetadata?: Meta }[]; categories?: { title: string }[] }[] };
  };
  const page = data.query?.pages?.[0];
  const info = page?.imageinfo?.[0];
  if (!page || page.missing || !info) throw new ImportError("Ese archivo no existe en Wikimedia Commons.");
  const em = info.extmetadata ?? {};
  const v = (k: string) => em[k]?.value;
  const license = licenseFromText(v("License") || v("LicenseShortName"));
  const authorHtml = v("Artist") ?? "";
  return {
    title: page.title,
    pageUrl: info.descriptionurl,
    // Copia reescalada por Commons (máx. 2400 px): suficiente y mucho más ligera que el original.
    fileUrl: info.thumburl && info.width > 2400 ? info.thumburl : info.url,
    width: info.width,
    height: info.height,
    mime: info.mime,
    license,
    licenseUrl: httpUrl(v("LicenseUrl")),
    author: plain(authorHtml) || undefined,
    authorUrl: httpUrl(authorHtml.match(/href="([^"]+)"/)?.[1]?.replace(/^\/\//, "https://")),
    description: plain(v("ImageDescription")) || undefined,
    categories: (page.categories ?? []).map((c) => c.title.replace(/^Category:/, "")),
  };
}

/**
 * Indicios de que el archivo muestra el modelo exacto: alguna categoría de
 * Commons cuyo nombre normalizado coincide con el dispositivo. Es una ayuda para
 * quien aprueba; la aprobación sigue siendo manual.
 */
export function commonsModelMatch(device: Pick<Device, "brand" | "model">, file: Pick<CommonsFile, "categories">) {
  const key = deviceKey(device.brand, device.model);
  const model = deviceKey("", device.model).replace(/^-/, "");
  return file.categories.filter((c) => {
    const k = deviceKey("", c).replace(/^-/, "");
    return k === key || k === model || k === key.replace(/-5g$/, "") || k === model.replace(/-5g$/, "");
  });
}

/** Importa un archivo de Commons como foto PROPUESTA (no aprobada) de una vista. */
export async function importCommonsPhoto(device: Device, slot: DeviceSlot, raw: string, user: string) {
  const file = await commonsLookup(raw);
  if (!isUsable(file.license.code)) {
    throw new ImportError(`${file.license.name}: ${LICENSES[file.license.code].reason ?? "licencia no admitida"}`);
  }
  if (!/^image\/(jpeg|png|webp)$/.test(file.mime)) throw new ImportError(`Tipo de archivo no admitido (${file.mime}).`);
  const matches = commonsModelMatch(device, file);
  const meta: ImageMeta = {
    status: "proposed",
    provider: "wikimedia",
    license: file.license.code,
    licenseName: file.license.name,
    licenseUrl: file.licenseUrl ?? LICENSES[file.license.code].url,
    author: file.author,
    authorUrl: file.authorUrl,
    sourceUrl: file.pageUrl,
    title: file.title,
    permissionNote: matches.length
      ? `Categoría de Commons: ${matches.join(", ")}`
      : `Ninguna categoría de Commons nombra el modelo exacto; categorías: ${file.categories.slice(0, 6).join(", ") || "ninguna"}`,
    attributionRequired: LICENSES[file.license.code].attribution,
    changes: "Redimensionada y convertida a WebP",
    externalId: file.title,
  };
  const alt = `${device.brand} ${device.model}`;
  const buf = await safeDownload(file.fileUrl);
  const item = await storeImage(buf, `${device.id}-${slot}`, "phone", meta, alt);
  const ref: ImageRef = { src: item.url, alt, width: item.width, height: item.height, credit: attributionText(meta), meta: { ...meta, approvedAt: undefined, approvedBy: undefined } };
  await setDevicePhoto(device.id, slot, ref);
  return { ref, file, matches, uploadedBy: user };
}
