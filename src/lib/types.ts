import type { IslandId, PhotoLicense, SectionId } from "@/lib/site";

export interface Photo {
  url: string;
  /** Ruta en el almacenamiento (para borrarla). Vacía si es un enlace externo. */
  path?: string;
  width: number;
  height: number;
  alt: string;
  license: PhotoLicense;
  /** Autor o entidad («Govern de les Illes Balears», «Joan Pérez / Wikimedia Commons»). */
  author: string;
  sourceUrl?: string;
}

export interface Source {
  name: string;
  url: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  /** Cuerpo en Markdown. */
  body: string;
  island: IslandId;
  section: SectionId;
  photo: Photo | null;
  breaking: boolean;
  status: "draft" | "published";
  authorName: string;
  sources: Source[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

/** Borrador de IA en curso (lo escribe la función en segundo plano de Netlify). */
export interface AiJob {
  id: string;
  status: "done" | "error";
  draft?: { title: string; summary: string; body: string };
  error?: string;
  createdAt: string;
}

export interface Collections {
  articles: Article;
  users: User;
  jobs: AiJob;
}
export type CollectionName = keyof Collections;

export interface Settings {
  siteName: string;
  tagline: string;
  siteUrl: string;
  /** Datos obligatorios del aviso legal (LSSI). */
  ownerName: string;
  ownerNif: string;
  ownerAddress: string;
  contactEmail: string;
  /** ID de editor de AdSense: ca-pub-XXXXXXXXXXXXXXXX. */
  adsenseClient: string;
  adsEnabled: boolean;
  /** Bloques manuales opcionales. Vacíos = solo anuncios automáticos. */
  slots: { home: string; article: string };
  searchConsoleVerification: string;
}
