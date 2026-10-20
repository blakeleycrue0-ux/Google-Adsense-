import type { CollectionName, Collections, ImageRef } from "@/lib/types";
import autoPhotos from "../auto-photos.json";
import { catalogDevices, linkPhones } from "@/lib/devices";
import { authors, categories, sources, stores } from "./taxonomy";
import { posts } from "./posts";
import { links, phones } from "./phones";
import { dealLinks, deals, guides } from "./commerce";
import { legalPages } from "./legal";

// Fotos reales elegidas durante la compilación (scripts/fotos.ts); sustituyen a las ilustraciones.
// El JSON lo genera la compilación: su tipo inferido varía según las fotos encontradas.
const photos = autoPhotos as unknown as Record<string, ImageRef>;

const seeds: { [K in CollectionName]: Collections[K][] } = {
  categories,
  authors,
  posts: posts.map((p) => (p.cover.illustrative && photos[`post:${p.id}`] ? { ...p, cover: photos[`post:${p.id}`] } : p)),
  // Las fichas se enlazan con su dispositivo de la biblioteca (fase 1 del catálogo).
  phones: linkPhones(phones, catalogDevices(1)),
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
  devices: catalogDevices(1),
};

/** Copia profunda de la semilla para que nadie mute el original en memoria. */
export function seedCollection<K extends CollectionName>(name: K): Collections[K][] {
  return structuredClone(seeds[name]);
}

export const seedNames = Object.keys(seeds) as CollectionName[];
