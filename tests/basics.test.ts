import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/format";
import { creditError, photoCredit } from "@/lib/photos";
import { renderMarkdown } from "@/lib/markdown";
import { isBlobOp } from "@/lib/db/blobs-ops";

describe("slugify", () => {
  it("quita tildes y signos", () => {
    expect(slugify("Vuelca un camión en la Ma-13 (Inca): 5 km de retenciones")).toBe("vuelca-un-camion-en-la-ma-13-inca-5-km-de-retenciones");
  });
});

describe("créditos de fotos", () => {
  it("exige autor en notas de prensa y licencias CC", () => {
    expect(creditError("press", "")).toMatch(/quién la hizo/);
    expect(creditError("cc-by", " ")).toMatch(/quién la hizo/);
    expect(creditError("own", "")).toBeNull();
    expect(creditError("inventada", "x")).not.toBeNull();
  });
  it("forma el texto del crédito", () => {
    expect(photoCredit({ license: "press", author: "Restaurante Can Pep" })).toBe("Foto: Restaurante Can Pep");
    expect(photoCredit({ license: "own", author: "" })).toBe("Foto propia");
    expect(photoCredit({ license: "unsplash", author: "Ana" })).toBe("Foto: Ana / Unsplash");
  });
});

describe("markdown", () => {
  it("elimina HTML peligroso", () => {
    const html = renderMarkdown('Hola <script>alert(1)</script> [x](javascript:alert(1)) <img src=x onerror=alert(1)>');
    expect(html).not.toMatch(/script|onerror|javascript:/);
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
