/**
 * Datos fijos de la web. El nombre, el lema, el texto «Sobre mí» y los datos
 * del titular se cambian en el panel (Ajustes); estos son los valores iniciales.
 */
export const DEFAULT_SITE_NAME = "La Libreta del Fogón";
export const DEFAULT_TAGLINE = "Recetas caseras, paso a paso, como en mi libreta";
/** Valores de etapas anteriores de la web: si siguen guardados, se usan los nuevos. */
export const LEGACY_SITE_NAMES = ["Brisa Balear", "Recetario"];
export const LEGACY_TAGLINES = ["Noticias de Mallorca, Menorca, Ibiza y Formentera", "Recetas de cocina explicadas paso a paso"];

export const CATEGORIES = [
  { id: "entrantes", name: "Entrantes y tapas", description: "Para empezar o para picar: tapas, ensaladas, cremas frías y aperitivos." },
  { id: "arroces-y-pastas", name: "Arroces y pastas", description: "Paellas, risottos, arroces melosos, pasta fresca y seca." },
  { id: "cuchara", name: "Cuchara", description: "Guisos, legumbres, sopas y cremas calientes." },
  { id: "carnes", name: "Carnes", description: "Asados, guisos y cortes a la plancha." },
  { id: "pescados", name: "Pescados y mariscos", description: "Pescados al horno, a la plancha, en salsa y mariscos." },
  { id: "verduras", name: "Verduras", description: "Platos de verdura y recetas vegetarianas." },
  { id: "salsas-y-fondos", name: "Salsas y fondos", description: "Las bases de la cocina: fondos, caldos, salsas madre y emulsiones." },
  { id: "panes-y-masas", name: "Panes y masas", description: "Panes, masas de hojaldre, quebrada, brioche y fermentaciones." },
  { id: "postres", name: "Postres", description: "Repostería, postres de cuchara, tartas y dulces." },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const categoryName = (id: string) => CATEGORIES.find((c) => c.id === id)?.name ?? "Recetas";
export const isCategory = (id: string): id is CategoryId => CATEGORIES.some((c) => c.id === id);

export const DIFFICULTIES = [
  { id: "facil", name: "Fácil" },
  { id: "media", name: "Media" },
  { id: "dificil", name: "Difícil" },
] as const;
export type DifficultyId = (typeof DIFFICULTIES)[number]["id"];
export const difficultyName = (id: string) => DIFFICULTIES.find((d) => d.id === id)?.name ?? "";

/** Origen de la foto. Determina el texto del crédito y si exige autoría. */
export const PHOTO_LICENSES = {
  own: { label: "Foto propia", needsAuthor: false },
  "cc-by": { label: "Creative Commons BY (Wikimedia, Flickr…)", needsAuthor: true },
  "cc-by-sa": { label: "Creative Commons BY-SA (Wikimedia…)", needsAuthor: true },
  cc0: { label: "Dominio público / CC0", needsAuthor: false },
  unsplash: { label: "Unsplash", needsAuthor: true },
  pexels: { label: "Pexels", needsAuthor: true },
  press: { label: "Cedida con permiso (marca, restaurante…)", needsAuthor: true },
} as const;

export type PhotoLicense = keyof typeof PHOTO_LICENSES;
