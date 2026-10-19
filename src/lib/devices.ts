import catalog from "@/data/catalogo/catalogo.json";
import { slugify } from "@/lib/format";
import { isUsable, LICENSES } from "@/lib/images/licenses";
import type { Device, DeviceSlot, ImageRef, Phone } from "@/lib/types";

/**
 * Biblioteca fija de móviles: catálogo cerrado de dispositivos con tres vistas
 * fotográficas (portada, frontal y trasera). Funciones puras, sin acceso a datos.
 */

export const SLOTS: { id: DeviceSlot; label: string; required: boolean }[] = [
  { id: "main", label: "Portada", required: true },
  { id: "front", label: "Frontal", required: false },
  { id: "back", label: "Trasera", required: false },
];

export const slotLabel = (slot: DeviceSlot) => SLOTS.find((s) => s.id === slot)!.label;

/** Clave {marca}-{modelo-normalizado}; «+» cuenta como «plus» (Galaxy S24+ ≠ Galaxy S24). */
export function deviceKey(brand: string, model: string) {
  return `${slugify(brand)}-${slugify(model.replace(/\+/g, " plus "))}`;
}

type CatalogModel = (typeof catalog)["models"][number];

/** Dispositivos del catálogo incluido en el repositorio (sin fotos: el ZIP no las trae). */
export function catalogDevices(phase?: 1 | 2): Device[] {
  return (catalog.models as CatalogModel[])
    .filter((m) => !phase || m.phase <= phase)
    .map((m) => ({
      id: deviceKey(m.brand, m.model),
      brand: m.brand,
      model: m.model,
      year: m.year,
      priority: m.priority as Device["priority"],
      family: m.family || undefined,
      slug: m.slug,
      phase: m.phase as 1 | 2,
      manufacturerReference: m.manufacturerReference || undefined,
      photos: {},
      updatedAt: new Date(0).toISOString(),
    }));
}

/**
 * Fusión idempotente: crea los dispositivos nuevos y actualiza solo la
 * identidad (marca, modelo, año, prioridad…) de los existentes. Nunca toca
 * las fotografías ya guardadas.
 */
export function mergeCatalog(existing: Device[], incoming: Device[]) {
  const byId = new Map(existing.map((d) => [d.id, d]));
  const toWrite: Device[] = [];
  let created = 0;
  let updated = 0;
  for (const inc of incoming) {
    const cur = byId.get(inc.id);
    if (!cur) {
      toWrite.push({ ...inc, updatedAt: new Date().toISOString() });
      created++;
      continue;
    }
    const identity = { brand: inc.brand, model: inc.model, year: inc.year, priority: inc.priority, family: inc.family, slug: inc.slug, phase: Math.min(cur.phase, inc.phase) as 1 | 2, manufacturerReference: inc.manufacturerReference };
    const changed = (Object.keys(identity) as (keyof typeof identity)[]).some((k) => cur[k] !== identity[k]);
    if (changed) {
      toWrite.push({ ...cur, ...identity, photos: cur.photos, updatedAt: new Date().toISOString() });
      updated++;
    }
  }
  return { toWrite, created, updated, unchanged: incoming.length - created - updated };
}

/** Enlaza las fichas existentes con su dispositivo, sin modificar ningún otro dato. */
export function linkPhones(phones: Phone[], devices: Pick<Device, "id">[]): Phone[] {
  const ids = new Set(devices.map((d) => d.id));
  return phones.map((p) => {
    if (p.deviceId) return p;
    const key = deviceKey(p.brand, p.model);
    return ids.has(key) ? { ...p, deviceId: key } : p;
  });
}

/** Motivos por los que una foto no se puede publicar (lista vacía: se puede). */
export function photoProblems(ref: ImageRef | undefined): string[] {
  if (!ref?.src) return ["No hay ningún archivo subido"];
  const m = ref.meta;
  if (!m) return ["Falta la procedencia y la licencia"];
  const out: string[] = [];
  if (!isUsable(m.license)) out.push(LICENSES[m.license].reason ?? "Licencia no admitida");
  if (LICENSES[m.license].attribution && !m.author?.trim()) out.push("Falta el autor (la licencia exige atribución)");
  if (["cc-by", "cc-by-sa", "pexels"].includes(m.license) && !m.sourceUrl?.trim()) out.push("Falta la página de origen");
  if ((m.license === "press" || m.license === "retailer") && !m.permissionNote?.trim()) out.push("Falta indicar el permiso o acuerdo de uso");
  return out;
}

/** Solo se muestran en la web las fotos reales aprobadas con licencia completa. */
export function isRenderable(ref: ImageRef | undefined): boolean {
  return Boolean(ref?.src && ref.meta?.status === "approved" && photoProblems(ref).length === 0);
}

/** Fotos aprobadas del dispositivo, en orden portada → frontal → trasera. */
export function approvedPhotos(device: Device | undefined): { slot: DeviceSlot; image: ImageRef }[] {
  if (!device) return [];
  return SLOTS.flatMap(({ id }) => (isRenderable(device.photos[id]) ? [{ slot: id, image: device.photos[id]! }] : []));
}

/** La portada aprobada de la biblioteca sustituye a la imagen de la ficha; sin ella, se mantiene la actual. */
export function withLibraryPhoto(phone: Phone, device: Device | undefined): Phone {
  const main = device?.photos.main;
  return main && isRenderable(main) ? { ...phone, image: { ...main, alt: main.alt || `${phone.brand} ${phone.model}` } } : phone;
}
