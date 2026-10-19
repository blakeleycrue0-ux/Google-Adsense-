import type { CollectionName, Collections } from "@/lib/types";
import { authors, categories, sources, stores } from "./taxonomy";
import { posts } from "./posts";
import { links, phones } from "./phones";
import { dealLinks, deals, guides } from "./commerce";
import { legalPages } from "./legal";

const seeds: { [K in CollectionName]: Collections[K][] } = {
  categories,
  authors,
  posts,
  phones,
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
