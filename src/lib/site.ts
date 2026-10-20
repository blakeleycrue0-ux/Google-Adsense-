/**
 * Datos fijos de la web. El nombre, el lema y los datos del titular se cambian
 * en el panel (Ajustes); estos son solo los valores iniciales.
 */
export const DEFAULT_SITE_NAME = "Brisa Balear";
export const DEFAULT_TAGLINE = "Noticias de Mallorca, Menorca, Ibiza y Formentera";

export const ISLANDS = [
  { id: "mallorca", name: "Mallorca" },
  { id: "menorca", name: "Menorca" },
  { id: "ibiza", name: "Ibiza" },
  { id: "formentera", name: "Formentera" },
  { id: "baleares", name: "Baleares" },
] as const;

export const SECTIONS = [
  { id: "sucesos", name: "Sucesos" },
  { id: "sociedad", name: "Sociedad" },
  { id: "politica", name: "Política" },
  { id: "movilidad", name: "Tráfico y transporte" },
  { id: "tiempo", name: "El tiempo" },
  { id: "economia", name: "Economía y turismo" },
  { id: "cultura", name: "Cultura y agenda" },
  { id: "deportes", name: "Deportes" },
] as const;

export type IslandId = (typeof ISLANDS)[number]["id"];
export type SectionId = (typeof SECTIONS)[number]["id"];

export const islandName = (id: string) => ISLANDS.find((i) => i.id === id)?.name ?? "Baleares";
export const sectionName = (id: string) => SECTIONS.find((s) => s.id === id)?.name ?? "Actualidad";
export const isIsland = (id: string): id is IslandId => ISLANDS.some((i) => i.id === id);
export const isSection = (id: string): id is SectionId => SECTIONS.some((s) => s.id === id);

/** Origen de la foto. Determina el texto del crédito y si exige autoría. */
export const PHOTO_LICENSES = {
  own: { label: "Foto propia", needsAuthor: false },
  press: { label: "Nota de prensa / gabinete oficial", needsAuthor: true },
  "cc-by": { label: "Creative Commons BY (Wikimedia, Flickr…)", needsAuthor: true },
  "cc-by-sa": { label: "Creative Commons BY-SA (Wikimedia…)", needsAuthor: true },
  cc0: { label: "Dominio público / CC0", needsAuthor: false },
  unsplash: { label: "Unsplash", needsAuthor: true },
  pexels: { label: "Pexels", needsAuthor: true },
} as const;

export type PhotoLicense = keyof typeof PHOTO_LICENSES;
