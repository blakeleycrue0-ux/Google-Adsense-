import { describe, expect, it } from "vitest";
import catalog from "@/data/catalogo/catalogo.json";
import { seedCollection } from "@/data/seed";
import { phones as seedPhones } from "@/data/seed/phones";
import { approvedPhotos, catalogDevices, deviceKey, isRenderable, linkPhones, mergeCatalog, photoProblems, withLibraryPhoto } from "@/lib/devices";
import { commonsModelMatch, commonsTitle } from "@/lib/images/library";
import type { Device, ImageMeta, ImageRef } from "@/lib/types";

const meta = (over: Partial<ImageMeta> = {}): ImageMeta => ({
  status: "approved",
  provider: "wikimedia",
  license: "cc-by-sa",
  licenseName: "CC BY-SA 4.0",
  author: "Vis M",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_S24.jpg",
  attributionRequired: true,
  approvedAt: "2026-10-19T00:00:00.000Z",
  approvedBy: "admin@voltio.test",
  ...over,
});
const photo = (over: Partial<ImageMeta> = {}): ImageRef => ({ src: "/uploads/2026/10/s24.webp", alt: "Samsung Galaxy S24", meta: meta(over) });

describe("clave de dispositivo", () => {
  it("normaliza marca y modelo y distingue las variantes «+»", () => {
    expect(deviceKey("Samsung", "Galaxy S24+")).toBe("samsung-galaxy-s24-plus");
    expect(deviceKey("Samsung", "Galaxy S24")).toBe("samsung-galaxy-s24");
    expect(deviceKey("Nothing", "Phone (3a)")).toBe("nothing-phone-3a");
    expect(deviceKey("Xiaomi", "Redmi Note 15 Pro+ 5G")).toBe("xiaomi-redmi-note-15-pro-plus-5g");
  });

  it("coincide con los identificadores del catálogo entregado", () => {
    for (const m of catalog.models) expect(deviceKey(m.brand, m.model)).toBe(m.id);
  });
});

describe("catálogo", () => {
  it("fase 1 tiene 54 móviles y el catálogo completo 99, todos sin fotos", () => {
    expect(catalogDevices(1)).toHaveLength(54);
    const all = catalogDevices(2);
    expect(all).toHaveLength(99);
    expect(new Set(all.map((d) => d.id)).size).toBe(99);
    expect(all.every((d) => Object.keys(d.photos).length === 0)).toBe(true);
  });

  it("la importación es idempotente y nunca toca las fotos guardadas", () => {
    const first = mergeCatalog([], catalogDevices(1));
    expect(first.created).toBe(54);
    const stored: Device[] = first.toWrite.map((d) => (d.id === "samsung-galaxy-s24" ? { ...d, photos: { main: photo() } } : d));

    const again = mergeCatalog(stored, catalogDevices(1));
    expect(again).toMatchObject({ created: 0, updated: 0, unchanged: 54 });

    const phase2 = mergeCatalog(stored, catalogDevices(2));
    expect(phase2.created).toBe(45);
    expect(phase2.toWrite.some((d) => d.id === "samsung-galaxy-s24")).toBe(false);

    const renamed = stored.map((d) => (d.id === "samsung-galaxy-s24" ? { ...d, year: 2020 } : d));
    const fixed = mergeCatalog(renamed, catalogDevices(1));
    expect(fixed.updated).toBe(1);
    expect(fixed.toWrite[0].year).toBe(2024);
    expect(fixed.toWrite[0].photos.main?.src).toBe("/uploads/2026/10/s24.webp");
  });
});

describe("fichas existentes", () => {
  it("se enlazan por el modelo exacto sin cambiar ningún otro dato", () => {
    const linked = linkPhones(seedPhones, catalogDevices(1));
    const byModel = Object.fromEntries(linked.map((p) => [`${p.brand} ${p.model}`, p.deviceId]));
    expect(byModel["Samsung Galaxy S25"]).toBe("samsung-galaxy-s25");
    expect(byModel["Samsung Galaxy S25 Ultra"]).toBe("samsung-galaxy-s25-ultra");
    expect(byModel["Xiaomi Xiaomi 15"]).toBe("xiaomi-xiaomi-15");
    expect(byModel["Motorola moto g85 5G"]).toBeUndefined(); // no está en el catálogo
    linked.forEach((p, i) => expect({ ...p, deviceId: undefined }).toEqual({ ...seedPhones[i], deviceId: undefined }));
  });

  it("los datos de demostración incluyen la fase 1 y las fichas enlazadas", () => {
    expect(seedCollection("devices")).toHaveLength(54);
    expect(seedCollection("phones").filter((p) => p.deviceId).length).toBeGreaterThanOrEqual(9);
  });
});

describe("qué foto se muestra", () => {
  it("sin foto, la ficha conserva su imagen actual", () => {
    const phone = seedPhones[0];
    expect(photoProblems(undefined)).toEqual(["No hay ningún archivo subido"]);
    expect(withLibraryPhoto(phone, { ...catalogDevices(1)[0], photos: {} })).toBe(phone);
  });

  it("una propuesta sin aprobar no se muestra", () => {
    expect(isRenderable(photo({ status: "proposed" }))).toBe(false);
  });

  it("una licencia incompleta impide mostrarla aunque esté aprobada", () => {
    expect(isRenderable(photo({ author: undefined }))).toBe(false);
    expect(photoProblems(photo({ author: undefined }))).toContain("Falta el autor (la licencia exige atribución)");
    expect(isRenderable(photo({ sourceUrl: undefined }))).toBe(false);
    expect(isRenderable(photo({ license: "cc-by-nc", licenseName: "CC BY-NC" }))).toBe(false);
    expect(isRenderable(photo({ license: "press", licenseName: "Prensa", permissionNote: undefined }))).toBe(false);
  });

  it("una foto aprobada con licencia completa sustituye a la de la ficha", () => {
    const device: Device = { ...catalogDevices(1).find((d) => d.id === "samsung-galaxy-s25")!, photos: { main: photo(), back: photo({ status: "proposed" }) } };
    const phone = seedPhones.find((p) => p.model === "Galaxy S25")!;
    expect(withLibraryPhoto(phone, device).image.src).toBe("/uploads/2026/10/s24.webp");
    expect(approvedPhotos(device).map((v) => v.slot)).toEqual(["main"]);
  });
});

describe("Wikimedia Commons", () => {
  it("acepta solo páginas de archivo de commons.wikimedia.org", () => {
    expect(commonsTitle("https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_S24.jpg")).toBe("File:Samsung Galaxy S24.jpg");
    expect(commonsTitle("https://commons.wikimedia.org/wiki/File:IPhone_13,_January_28,_2024.jpg")).toBe("File:IPhone 13, January 28, 2024.jpg");
    expect(() => commonsTitle("https://example.com/wiki/File:x.jpg")).toThrow();
    expect(() => commonsTitle("https://commons.wikimedia.org/wiki/Category:Samsung_Galaxy_S24")).toThrow();
    expect(() => commonsTitle("javascript:alert(1)")).toThrow();
  });

  it("reconoce el modelo exacto por las categorías, no por cualquier mención de la marca", () => {
    const s24 = { brand: "Samsung", model: "Galaxy S24" };
    expect(commonsModelMatch(s24, { categories: ["Samsung Galaxy S24", "Smartphones by Samsung"] })).toEqual(["Samsung Galaxy S24"]);
    expect(commonsModelMatch(s24, { categories: ["Samsung Galaxy S24 Ultra", "Samsung Galaxy S23"] })).toEqual([]);
    expect(commonsModelMatch({ brand: "Samsung", model: "Galaxy S24+" }, { categories: ["Samsung Galaxy S24"] })).toEqual([]);
  });
});
