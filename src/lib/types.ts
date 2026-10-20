import type { CategoryId, DifficultyId, PhotoLicense } from "@/lib/site";

export interface Photo {
  url: string;
  /** Ruta en el almacenamiento (para borrarla). Vacía si es un enlace externo. */
  path?: string;
  width: number;
  height: number;
  alt: string;
  license: PhotoLicense;
  /** Autor o entidad («Joan Pérez / Wikimedia Commons»). */
  author: string;
  sourceUrl?: string;
}

/**
 * Receta. «private» solo se ve en el panel; «published», en la web.
 * Ingredientes y pasos se guardan línea a línea: una línea de ingredientes que
 * empieza por «#» es un subtítulo («# Para la salsa»).
 */
export interface Recipe {
  id: string;
  slug: string;
  title: string;
  /** Presentación corta (sale en Google y en las tarjetas). */
  summary: string;
  category: CategoryId;
  ingredients: string[];
  steps: string[];
  /** Consejos, variantes y conservación (Markdown, opcional). */
  tips: string;
  prepMinutes: number;
  cookMinutes: number;
  /** Raciones: «4 personas», «1 bizcocho de 22 cm»… */
  servings: string;
  difficulty: DifficultyId;
  tags: string[];
  photo: Photo | null;
  status: "private" | "published";
  authorName: string;
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
  draft?: RecipeDraft;
  error?: string;
  createdAt: string;
}

export interface RecipeDraft {
  title: string;
  summary: string;
  ingredients: string[];
  steps: string[];
  tips: string;
  prepMinutes: number;
  cookMinutes: number;
  servings: string;
}

export interface Collections {
  recipes: Recipe;
  users: User;
  jobs: AiJob;
}
export type CollectionName = keyof Collections;

export interface Settings {
  siteName: string;
  tagline: string;
  siteUrl: string;
  /** Texto de la página «Sobre mí» (Markdown). */
  about: string;
  /** Datos obligatorios del aviso legal (LSSI). */
  ownerName: string;
  ownerNif: string;
  ownerAddress: string;
  contactEmail: string;
  /** Redes sociales (opcionales) para enlazar desde la web. */
  instagram: string;
  tiktok: string;
  /** ID de editor de AdSense: ca-pub-XXXXXXXXXXXXXXXX. */
  adsenseClient: string;
  adsEnabled: boolean;
  /** Bloques manuales opcionales. Vacíos = solo anuncios automáticos. */
  slots: { home: string; article: string };
  searchConsoleVerification: string;
}
