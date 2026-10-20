import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/format";
import { creditError, photoCredit } from "@/lib/photos";
import { renderMarkdown, splitForAd } from "@/lib/markdown";
import { isBlobOp } from "@/lib/db/blobs-ops";

describe("slugify", () => {
  it("quita tildes y signos", () => {
    expect(slugify("Vuelca un camión en la Ma-13 (Inca): 5 km de retenciones")).toBe("vuelca-un-camion-en-la-ma-13-inca-5-km-de-retenciones");
  });
});

describe("créditos de fotos", () => {
  it("exige autor en notas de prensa y licencias CC", () => {
    expect(creditError("press", "")).toMatch(/autor/);
    expect(creditError("cc-by", " ")).toMatch(/autor/);
    expect(creditError("own", "")).toBeNull();
    expect(creditError("inventada", "x")).not.toBeNull();
  });
  it("forma el texto del crédito", () => {
    expect(photoCredit({ license: "press", author: "Guardia Civil" })).toBe("Foto: Guardia Civil");
    expect(photoCredit({ license: "own", author: "" })).toBe("Foto: Redacción");
    expect(photoCredit({ license: "unsplash", author: "Ana" })).toBe("Foto: Ana / Unsplash");
  });
});

describe("markdown", () => {
  it("elimina HTML peligroso", () => {
    const html = renderMarkdown('Hola <script>alert(1)</script> [x](javascript:alert(1)) <img src=x onerror=alert(1)>');
    expect(html).not.toMatch(/script|onerror|javascript:/);
  });
  it("solo divide noticias largas", () => {
    expect(splitForAd("<p>a</p><p>b</p>")[1]).toBe("");
    const [a, b] = splitForAd("<p>1</p><p>2</p><p>3</p><p>4</p><p>5</p><p>6</p>");
    expect(a + b).toBe("<p>1</p><p>2</p><p>3</p><p>4</p><p>5</p><p>6</p>");
    expect(b).not.toBe("");
  });
});

describe("operaciones de Blobs", () => {
  it("rechaza tiendas desconocidas y rutas con ..", () => {
    expect(isBlobOp({ op: "getJSON", store: "data", key: "d/articles/x" })).toBe(true);
    expect(isBlobOp({ op: "getJSON", store: "otra", key: "x" })).toBe(false);
    expect(isBlobOp({ op: "delete", store: "media", key: "../x" })).toBe(false);
    expect(isBlobOp({ op: "exec", store: "data", key: "x" })).toBe(false);
  });
});
