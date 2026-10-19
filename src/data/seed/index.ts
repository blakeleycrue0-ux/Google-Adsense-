import type { CollectionName, Collections, ImageRef } from "@/lib/types";
import autoPhotos from "../auto-photos.json";
import { authors, categories, sources, stores } from "./taxonomy";
import { posts } from "./posts";
import { links, phones } from "./phones";
import { dealLinks, deals, guides } from "./commerce";
import { legalPages } from "./legal";

// Fotos reales elegidas durante la compilación (scripts/fotos.ts); sustituyen a las ilustraciones.
const photos = autoPhotos as Record<string, ImageRef>;

const seeds: { [K in CollectionName]: Collections[K][] } = {
  categories,
  authors,
  posts: posts.map((p) => (p.cover.illustrative && photos[`post:${p.id}`] ? { ...p, cover: photos[`post:${p.id}`] } : p)),
  phones: phones.map((p) => (p.image.illustrative && photos[`phone:${p.id}`] ? { ...p, image: photos[`phone:${p.id}`] } : p)),
  stores,
  links: [...links, ...dealLinks],
  deals,
  guides,
  sources,
  detected: [],
  legal: legalPages,
  media: [],
  users: [],
  messages: [],
  imageSearches: [],
};

/** Copia profunda de la semilla para que nadie mute el original en memoria. */
export function seedCollection<K extends CollectionName>(name: K): Collections[K][] {
  return structuredClone(seeds[name]);
}

export const seedNames = Object.keys(seeds) as CollectionName[];
