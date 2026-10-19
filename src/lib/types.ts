// Modelo de datos de la plataforma. Todas las entidades se guardan como
// documentos con `id` en el almacenamiento configurado (JSON local o Supabase).

export type ID = string;

export interface ImageRef {
  src: string;
  alt: string;
  credit?: string;
  /** Imagen ilustrativa (no es una fotografía real del producto o suceso). */
  illustrative?: boolean;
  width?: number;
  height?: number;
}

export interface Category {
  id: ID;
  slug: string;
  name: string;
  emoji?: string;
  description: string;
  order: number;
  /** Mostrar en la navegación principal. */
  inNav?: boolean;
}

export interface Author {
  id: ID;
  slug: string;
  name: string;
  role: string;
  bio: string;
}

export interface SourceLink {
  title: string;
  url: string;
  publisher: string;
}

export type PostStatus = "draft" | "review" | "scheduled" | "published";

export interface Post {
  id: ID;
  slug: string;
  title: string;
  subtitle: string;
  /** Cuerpo en Markdown. Los apartados se marcan con `##`. */
  body: string;
  categoryId: ID;
  tags: string[];
  authorId: ID;
  cover: ImageRef;
  status: PostStatus;
  /** Fecha de publicación (ISO). Si es futura y el estado es `scheduled`, se publica al llegar. */
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  sources: SourceLink[];
  isBreaking?: boolean;
  isFeatured?: boolean;
  /** Contenido de demostración: se marca visualmente en la web. */
  isDemo?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  /** Elemento detectado del que procede el borrador, si lo hay. */
  detectedItemId?: ID;
}

export type OS = "android" | "ios";
export type PerformanceTier = "basica" | "media" | "alta" | "tope";

export interface PhoneSpecs {
  displayInches: number;
  displayType: string;
  refreshHz: number;
  resolution: string;
  chipset: string;
  ramGB: number[];
  storageGB: number[];
  batteryMah: number;
  chargingW?: number;
  mainCameraMp: number;
  ultrawideMp?: number;
  telephotoMp?: number;
  telephotoZoom?: string;
  frontCameraMp: number;
  weightG: number;
  ipRating?: string;
  fiveG: boolean;
  /** Años de actualizaciones de sistema anunciados por el fabricante. */
  osUpdatesYears?: number;
}

export interface PriceOffer {
  id: ID;
  storeId: ID;
  price: number;
  currency: "EUR";
  /** Enlace administrable (afiliado o directo) por el que se redirige. */
  linkId: ID;
  /** Fecha de la última comprobación manual o automática (ISO). */
  checkedAt: string;
  source: "manual" | "api" | "demo";
  variant?: string;
}

export interface Phone {
  id: ID;
  slug: string;
  brand: string;
  model: string;
  releaseYear: number;
  os: OS;
  image: ImageRef;
  summary: string;
  specs: PhoneSpecs;
  /** Clasificación editorial del procesador (no es un resultado de pruebas). */
  performanceTier: PerformanceTier;
  pros: string[];
  cons: string[];
  alternativeIds: ID[];
  offers: PriceOffer[];
  /** Especificaciones revisadas contra la ficha oficial del fabricante. */
  specsVerified: boolean;
  officialUrl?: string;
  isDemo?: boolean;
  updatedAt: string;
}

export interface Store {
  id: ID;
  name: string;
  domain: string;
  /** Programa de afiliación asociado (solo se aplica si está activo). */
  affiliate?: {
    program: string;
    param: string;
    value: string;
    enabled: boolean;
  };
}

export interface AffiliateLink {
  id: ID;
  label: string;
  storeId: ID;
  targetUrl: string;
  active: boolean;
  /** Si es false, se enlaza sin parámetros de afiliado aunque el programa esté activo. */
  applyAffiliate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: ID;
  title: string;
  productType: "movil" | "auriculares" | "portatil" | "tablet" | "reloj" | "otro";
  storeId: ID;
  price: number;
  /** Solo si se ha verificado en la tienda (p. ej. precio tachado oficial). */
  previousPrice?: number;
  linkId: ID;
  image?: ImageRef;
  checkedAt: string;
  expiresAt?: string;
  notes?: string;
  phoneId?: ID;
  isDemo?: boolean;
  active: boolean;
}

export interface Guide {
  id: ID;
  slug: string;
  title: string;
  emoji?: string;
  intro: string;
  body: string;
  maxPrice?: number;
  minPrice?: number;
  phoneIds: ID[];
  updatedAt: string;
  isDemo?: boolean;
  order: number;
}

export interface NewsSource {
  id: ID;
  name: string;
  feedUrl: string;
  siteUrl: string;
  language: string;
  defaultCategoryId?: ID;
  active: boolean;
  lastFetchedAt?: string;
  lastError?: string;
  lastItemCount?: number;
}

export type DetectedStatus = "new" | "drafted" | "discarded";

export interface DetectedItem {
  id: ID;
  sourceId: ID;
  sourceName: string;
  title: string;
  url: string;
  normalizedUrl: string;
  /** Extracto del feed tal como lo publica la fuente (no se republica). */
  snippet: string;
  publishedAt?: string;
  detectedAt: string;
  suggestedCategoryId?: ID;
  matchedKeywords: string[];
  /** Si es un duplicado probable, id del elemento original. */
  duplicateOf?: ID;
  similarity?: number;
  status: DetectedStatus;
  draftPostId?: ID;
}

export type AdPlacement =
  | "home-after-hero"
  | "home-mid"
  | "article-inline"
  | "article-end"
  | "sidebar"
  | "listing";

export interface AdSlotSetting {
  slotId: string;
  enabled: boolean;
  format: "auto" | "fluid" | "rectangle" | "horizontal";
}

export interface Settings {
  siteName: string;
  tagline: string;
  siteUrl: string;
  contactEmail: string;
  /** Muestra avisos de contenido de demostración. */
  demoMode: boolean;
  analytics: { gaMeasurementId: string; searchConsoleVerification: string };
  ads: {
    enabled: boolean;
    client: string;
    showPlaceholders: boolean;
    slots: Record<AdPlacement, AdSlotSetting>;
  };
  consent: {
    /** builtin: banner propio + Consent Mode v2. external: CMP certificada (p. ej. la de Google). */
    mode: "builtin" | "external";
  };
  affiliates: { disclosure: string };
  legal: {
    ownerName: string;
    taxId: string;
    address: string;
    registry: string;
  };
  social: { x: string; instagram: string; youtube: string };
  updatedAt: string;
}

export interface LegalPage {
  id: ID;
  slug: string;
  title: string;
  body: string;
  updatedAt: string;
  needsLegalReview: boolean;
}

export interface MediaItem {
  id: ID;
  url: string;
  path: string;
  alt: string;
  width?: number;
  height?: number;
  size: number;
  mime: string;
  uploadedAt: string;
}

export type Role = "admin" | "editor";

export interface User {
  id: ID;
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
  createdAt: string;
}

export interface ContactMessage {
  id: ID;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface Collections {
  categories: Category;
  authors: Author;
  posts: Post;
  phones: Phone;
  stores: Store;
  links: AffiliateLink;
  deals: Deal;
  guides: Guide;
  sources: NewsSource;
  detected: DetectedItem;
  legal: LegalPage;
  media: MediaItem;
  users: User;
  messages: ContactMessage;
}

export type CollectionName = keyof Collections;
