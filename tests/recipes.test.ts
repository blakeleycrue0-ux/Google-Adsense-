import { describe, expect, it } from "vitest";
import { formatMinutes, groupIngredients, isoDuration, normalizeRecipe, parseLines, parseTags, publishProblems, uniqueSlug } from "@/lib/recipes";
import type { Photo } from "@/lib/types";

describe("líneas de ingredientes y pasos", () => {
  it("quita viñetas, numeración y líneas vacías", () => {
    expect(parseLines("- 200 g de harina\n\n1. Mezclar todo\n2) Hornear\n• sal")).toEqual(["200 g de harina", "Mezclar todo", "Hornear", "sal"]);
  });
  it("agrupa por subtítulos #", () => {
    expect(groupIngredients(["1 huevo", "# Para la salsa", "tomate", "aceite"])).toEqual([
      { title: "", items: ["1 huevo"] },
      { title: "Para la salsa", items: ["tomate", "aceite"] },
    ]);
  });
});

describe("tiempos", () => {
  it("se muestran legibles", () => {
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(60)).toBe("1 h");
    expect(formatMinutes(80)).toBe("1 h 20 min");
    expect(formatMinutes(0)).toBe("");
  });
  it("en formato ISO para Google", () => {
    expect(isoDuration(80)).toBe("PT1H20M");
    expect(isoDuration(60)).toBe("PT1H");
    expect(isoDuration(15)).toBe("PT15M");
  });
});

describe("slugs y etiquetas", () => {
  it("no repite slugs", () => {
    expect(uniqueSlug("Lentejas estofadas", new Set())).toBe("lentejas-estofadas");
    expect(uniqueSlug("Lentejas estofadas", new Set(["lentejas-estofadas"]))).toBe("lentejas-estofadas-2");
  });
  it("etiquetas sin duplicados y en minúsculas", () => {
    expect(parseTags("Legumbres, invierno, legumbres, , x")).toEqual(["legumbres", "invierno"]);
  });
});

describe("publicación", () => {
  const photo: Photo = { url: "/u/a.webp", width: 1, height: 1, alt: "", license: "own", author: "" };
  const ok = {
    title: "Lentejas estofadas",
    summary: "Unas lentejas de toda la vida, con chorizo y verduras, que mejoran de un día para otro.",
    ingredients: ["300 g de lentejas", "1 chorizo"],
    steps: ["Sofreír la verdura.", "Añadir las lentejas y cocer 40 minutos."],
    photo,
  };
  it("una receta completa se puede publicar", () => {
    expect(publishProblems(ok)).toEqual([]);
  });
  it("sin foto ni pasos, no", () => {
    expect(publishProblems({ ...ok, photo: null, steps: ["Todo junto"] })).toHaveLength(2);
  });
  it("los subtítulos no cuentan como ingredientes", () => {
    expect(publishProblems({ ...ok, ingredients: ["# Para la salsa", "tomate"] })).toHaveLength(1);
  });
});

describe("normalización", () => {
  it("las recetas guardadas sin campos nuevos se leen privadas y completas", () => {
    const r = normalizeRecipe({ id: "rec_1", title: "Prueba" });
    expect(r.status).toBe("private");
    expect(r.slug).toBe("rec_1");
    expect(r.ingredients).toEqual([]);
    expect(r.category).toBe("entrantes");
  });
});

describe("recetas iniciales", () => {
  it("todas están completas salvo la foto, sin marcas pendientes y con títulos únicos", async () => {
    const { SEED_RECIPES } = await import("@/data/recetas-iniciales");
    const { slugify } = await import("@/lib/format");
    const { isCategory } = await import("@/lib/site");
    const photo: Photo = { url: "/u/a.webp", width: 1, height: 1, alt: "", license: "own", author: "" };
    expect(SEED_RECIPES.length).toBeGreaterThanOrEqual(40);
    expect(new Set(SEED_RECIPES.map((r) => slugify(r.title))).size).toBe(SEED_RECIPES.length);
    for (const r of SEED_RECIPES) {
      expect(publishProblems({ ...r, photo }), r.title).toEqual([]);
      expect(isCategory(r.category), r.title).toBe(true);
      expect(JSON.stringify(r)).not.toMatch(/\[REVISAR|​/);
    }
  });
});

describe("fotos libres", () => {
  it("cada receta inicial tiene búsqueda de foto preparada", async () => {
    const { SEED_RECIPES } = await import("@/data/recetas-iniciales");
    const { PHOTO_QUERIES } = await import("@/data/fotos-recetas");
    const { slugify } = await import("@/lib/format");
    const missing = SEED_RECIPES.filter((r) => !PHOTO_QUERIES[slugify(r.title)]).map((r) => r.title);
    expect(missing).toEqual([]);
  });

  it("solo acepta licencias libres de Commons", async () => {
    const { commonsLicense } = await import("@/lib/photos");
    expect(commonsLicense("CC BY-SA 4.0")).toBe("cc-by-sa");
    expect(commonsLicense("CC BY 2.0")).toBe("cc-by");
    expect(commonsLicense("CC0")).toBe("cc0");
    expect(commonsLicense("Public domain")).toBe("cc0");
    expect(commonsLicense("CC BY-NC 2.0")).toBeNull();
    expect(commonsLicense("GFDL")).toBeNull();
  });
});
