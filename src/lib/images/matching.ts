import { normalizeText } from "@/lib/format";
import type { Phone, Post } from "@/lib/types";

/**
 * Comprobaciones para no asociar una imagen al contenido equivocado.
 * Son deliberadamente estrictas: ante la duda se descarta y el contenido
 * queda pendiente de selección manual.
 */

const words = (s: string) =>
  normalizeText(s)
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);

/** Palabras que distinguen variantes de un mismo modelo. */
const VARIANTS = ["pro", "max", "ultra", "plus", "lite", "fe", "mini", "edge", "neo", "fold", "flip", "air", "se", "xl"];

/** Colores habituales (es/en) para detectar fotografías de otra variante de color. */
const COLORS: Record<string, string[]> = {
  negro: ["negro", "black", "graphite", "grafito", "obsidian", "midnight", "onyx", "phantom black"],
  blanco: ["blanco", "white", "porcelain", "cream", "crema", "starlight"],
  azul: ["azul", "blue", "navy", "icyblue", "ultramarine"],
  verde: ["verde", "green", "mint", "menta", "sage"],
  rosa: ["rosa", "pink", "peony", "coral"],
  morado: ["morado", "violeta", "purple", "lavender", "lavanda", "lilac"],
  amarillo: ["amarillo", "yellow", "lemon"],
  rojo: ["rojo", "red"],
  gris: ["gris", "gray", "grey", "silver", "plata", "titanium", "titanio"],
  dorado: ["dorado", "gold", "oro"],
};

export interface MatchResult {
  ok: boolean;
  score: number;
  reasons: string[];
}

/**
 * ¿El texto de la imagen (título, descripción, etiquetas) describe exactamente
 * este modelo? Exige todas las partes del nombre del modelo, rechaza variantes
 * (Pro, Ultra, Plus…) que el modelo no tiene y textos que mencionan otros modelos.
 */
export function matchPhone(phone: Pick<Phone, "brand" | "model" | "colors">, text: string): MatchResult {
  const t = words(text);
  const tset = new Set(t);
  const modelTokens = words(phone.model);
  const brandTokens = words(phone.brand);
  const reasons: string[] = [];

  const optional = new Set(["5g", "4g", "galaxy"]);
  const missing = modelTokens.filter((w) => !optional.has(w) && !tset.has(w));
  if (missing.length) return { ok: false, score: 0, reasons: [`No menciona «${missing.join(" ")}» del modelo`] };

  const extraVariant = VARIANTS.filter((v) => tset.has(v) && !modelTokens.includes(v));
  if (extraVariant.length) return { ok: false, score: 0, reasons: [`Parece otra variante (${extraVariant.join(", ")})`] };

  if (modelTokens.includes("5g") && (tset.has("4g") || tset.has("lte"))) {
    return { ok: false, score: 0, reasons: ["Parece la versión 4G/LTE"] };
  }

  // Otros números de modelo junto a la palabra de familia (p. ej. «iPhone 15» buscando «iPhone 16»).
  const family = modelTokens.find((w) => !/\d/.test(w) && !optional.has(w));
  const modelNumber = modelTokens.find((w) => /\d/.test(w) && !optional.has(w));
  if (family && modelNumber) {
    for (let i = 0; i < t.length - 1; i++) {
      if (t[i] === family && /\d/.test(t[i + 1]) && t[i + 1] !== modelNumber && !optional.has(t[i + 1])) {
        return { ok: false, score: 0, reasons: [`Menciona otro modelo (${t[i]} ${t[i + 1]})`] };
      }
    }
  }
  // Mismo prefijo con otro número: «a15» o «a16s» cuando se busca «a16».
  if (modelNumber) {
    const prefix = modelNumber.replace(/\d.*$/, "");
    const other = t.find((w) => w !== modelNumber && prefix && w.startsWith(prefix) && /\d/.test(w) && w.length <= modelNumber.length + 2);
    if (other) return { ok: false, score: 0, reasons: [`Menciona otro modelo (${other})`] };
  }

  if (phone.colors?.length) {
    const allowed = new Set(phone.colors.map((c) => normalizeText(c)));
    const allowedGroups = new Set(
      Object.entries(COLORS)
        .filter(([, names]) => names.some((n) => allowed.has(n)))
        .map(([g]) => g),
    );
    const flat = ` ${t.join(" ")} `;
    for (const [group, names] of Object.entries(COLORS)) {
      if (allowedGroups.has(group)) continue;
      const hit = names.find((n) => flat.includes(` ${n} `));
      if (hit) return { ok: false, score: 0, reasons: [`Color no comercializado en este modelo (${hit})`] };
    }
  }

  let score = 60;
  reasons.push("Coincide el nombre exacto del modelo");
  if (brandTokens.every((w) => tset.has(w))) {
    score += 15;
    reasons.push("Incluye la marca");
  }
  if (["official", "oficial", "press", "prensa"].some((w) => tset.has(w))) {
    score += 5;
    reasons.push("Parece material oficial");
  }
  return { ok: true, score, reasons };
}

const STOP = new Set(
  (
    "el la los las un una unos unas de del al a en y o u que por para con sin se su sus es son ya como mas este esta estos estas lo le les ha han hay " +
    "desde cuando donde qué que cómo como porque por qué todo todos toda todas nuevo nueva nuevos nuevas otro otra muy mas menos ser sido tiene tienen " +
    "the a an of to in on for and or is are with from at by its it as how why what new your you guia guide cual cuales esto eso"
  ).split(" "),
);

/** Términos de tecnología en español → inglés, porque la mayoría de bancos indexan en inglés. */
const ES_EN: Record<string, string> = {
  movil: "smartphone",
  moviles: "smartphone",
  telefono: "phone",
  cargador: "charger",
  carga: "charging",
  bateria: "battery",
  portatil: "laptop",
  portatiles: "laptop",
  ordenador: "computer",
  contrasena: "password",
  contrasenas: "password",
  seguridad: "security",
  inteligencia: "artificial intelligence",
  artificial: "",
  ia: "artificial intelligence",
  procesador: "processor",
  procesadores: "processor",
  videojuegos: "video games",
  consola: "game console",
  red: "network",
  router: "wifi router",
  copia: "backup",
  nube: "cloud",
  etiqueta: "label",
  energetica: "energy",
  reglamento: "regulation",
  europeo: "european union",
  europa: "europe",
  reacondicionado: "refurbished smartphone",
  pantalla: "screen",
  camara: "camera",
  auriculares: "headphones",
  tableta: "tablet",
  reloj: "smartwatch",
  chip: "microchip",
};

/** Palabras clave de búsqueda a partir del título y las etiquetas del artículo. */
export function postKeywords(post: Pick<Post, "title" | "tags">): { es: string[]; en: string[] } {
  const raw = [...post.tags.flatMap((t) => words(t)), ...words(post.title)];
  const es = [...new Set(raw.filter((w) => w.length > 2 && !STOP.has(w)))].slice(0, 8);
  const en = [
    ...new Set(
      es
        .map((w) => (w in ES_EN ? ES_EN[w] : /\d|[a-z]+[0-9]/.test(w) || w.length <= 5 ? w : ""))
        .filter(Boolean),
    ),
  ].slice(0, 5);
  return { es, en };
}

/** Relevancia temática de una imagen para un artículo (0–100). */
export function matchTopic(keywords: string[], text: string): MatchResult {
  const tset = new Set(words(text));
  const flat = ` ${words(text).join(" ")} `;
  const hits = keywords.filter((k) => (k.includes(" ") ? flat.includes(` ${normalizeText(k)} `) : tset.has(normalizeText(k))));
  if (!hits.length) return { ok: false, score: 0, reasons: ["Sin relación evidente con el tema"] };
  const score = Math.min(90, 30 + hits.length * 20);
  return { ok: true, score, reasons: [`Relacionada con: ${hits.join(", ")}`] };
}

/** Bonificación por calidad (resolución y proporción adecuadas para la portada). */
export function qualityScore(width: number, height: number, kind: "cover" | "phone") {
  const reasons: string[] = [];
  let score = 0;
  if (!width || !height) return { score: -10, reasons: ["Dimensiones desconocidas"], ok: true };
  if (kind === "cover") {
    if (width < 1200) return { score: 0, reasons: [`Resolución insuficiente (${width}px de ancho; mínimo 1200)`], ok: false };
    const ratio = width / height;
    if (ratio >= 1.3 && ratio <= 2) {
      score += 10;
      reasons.push("Proporción horizontal adecuada");
    } else if (ratio < 1) {
      score -= 15;
      reasons.push("Vertical: el recorte perderá mucho");
    }
    if (width >= 2000) {
      score += 5;
      reasons.push("Alta resolución");
    }
  } else {
    if (Math.max(width, height) < 600) return { score: 0, reasons: [`Resolución insuficiente (${width}×${height})`], ok: false };
    if (height >= width) {
      score += 5;
      reasons.push("Encuadre vertical, adecuado para fichas");
    }
  }
  return { score, reasons, ok: true };
}
