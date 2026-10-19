import { describe, expect, it } from "vitest";
import { matchPhone, matchTopic, postKeywords, qualityScore } from "@/lib/images/matching";

const a16 = { brand: "Samsung", model: "Galaxy A16 5G" };
const s25 = { brand: "Samsung", model: "Galaxy S25" };
const pixel9a = { brand: "Google", model: "Pixel 9a" };
const iphone16 = { brand: "Apple", model: "iPhone 16" };

describe("coincidencia exacta de modelo", () => {
  it("acepta el modelo correcto", () => {
    expect(matchPhone(a16, "Samsung Galaxy A16 5G (front and back)").ok).toBe(true);
    expect(matchPhone(s25, "Samsung Galaxy S25 smartphone").ok).toBe(true);
    expect(matchPhone(pixel9a, "Google Pixel 9a in Porcelain").ok).toBe(true);
  });
  it("rechaza otro número de modelo", () => {
    expect(matchPhone(a16, "Samsung Galaxy A15 5G").ok).toBe(false);
    expect(matchPhone(iphone16, "iPhone 15 and iPhone 16 side by side").ok).toBe(false);
    expect(matchPhone(pixel9a, "Google Pixel 9 Pro").ok).toBe(false);
  });
  it("rechaza variantes que el modelo no tiene", () => {
    expect(matchPhone(s25, "Samsung Galaxy S25 Ultra").ok).toBe(false);
    expect(matchPhone(s25, "Samsung Galaxy S25+").ok).toBe(false);
    expect(matchPhone(iphone16, "Apple iPhone 16 Pro Max").ok).toBe(false);
  });
  it("rechaza la versión 4G si el modelo es 5G", () => {
    expect(matchPhone(a16, "Samsung Galaxy A16 LTE").ok).toBe(false);
  });
  it("rechaza colores que no se comercializan", () => {
    const p = { ...a16, colors: ["negro", "gris"] };
    expect(matchPhone(p, "Samsung Galaxy A16 5G Light Green").ok).toBe(false);
    expect(matchPhone(p, "Samsung Galaxy A16 5G black").ok).toBe(true);
  });
  it("rechaza textos genéricos sin el modelo", () => {
    expect(matchPhone(a16, "Person holding a smartphone").ok).toBe(false);
  });
});

describe("relevancia temática", () => {
  it("extrae palabras clave y las traduce", () => {
    const k = postKeywords({ title: "El USB-C ya es el cargador común en Europa", tags: ["USB-C", "carga"] });
    expect(k.en).toContain("charger");
    expect(k.es).toContain("cargador");
  });
  it("puntúa por coincidencias", () => {
    expect(matchTopic(["usb", "charger"], "USB-C charger cable on a desk").ok).toBe(true);
    expect(matchTopic(["usb", "charger"], "Mountain landscape at sunset").ok).toBe(false);
  });
  it("exige resolución mínima para portadas", () => {
    expect(qualityScore(800, 600, "cover").ok).toBe(false);
    expect(qualityScore(2400, 1600, "cover").score).toBeGreaterThan(0);
  });
});
