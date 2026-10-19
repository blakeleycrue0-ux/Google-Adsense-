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
  /** Procedencia, licencia y aprobación. Ausente en imágenes antiguas. */
  meta?: ImageMeta;
}

/** Proveedores de imágenes admitidos por el sistema. */
export type ImageProviderId =
  | "upload"
  | "wikimedia"
  | "openverse"
  | "pexels"
  | "unsplash"
  | "feed"
  | "press"
  | "retailer"
  | "demo";

/**
 * Licencias reconocidas. Solo se pueden seleccionar las que permiten uso
 * comercial y la adaptación técnica (redimensionar/recortar): ver lib/images/licenses.ts.
 */
export type LicenseCode =
  | "own"
  | "cc0"
  | "pdm"
  | "cc-by"
  | "cc-by-sa"
  | "pexels"
  | "unsplash"
  | "press"
  | "retailer"
  | "cc-by-nc"
  | "cc-by-nd"
  | "cc-by-nc-sa"
  | "cc-by-nc-nd"
  | "unknown";

export type ImageStatus = "approved" | "proposed" | "pending";

export interface ImageMeta {
  status: ImageStatus;
  provider: ImageProviderId;
  license: LicenseCode;
  licenseName: string;
  licenseUrl?: string;
  author?: string;
  authorUrl?: string;
  /** Página de origen de la imagen (ficha en Commons, Pexels, nota de prensa…). */
  sourceUrl?: string;
  /** Título original de la imagen en la fuente. */
  title?: string;
  /** Detalle del permiso (imágenes de prensa, fuentes RSS autorizadas, afiliación). */
  permissionNote?: string;
  attributionRequired: boolean;
  /** Se sirve desde el CDN del proveedor (obligatorio en Unsplash y programas de afiliación). */
  hotlinked?: boolean;
  /** Punto de interés para el recorte con object-fit: cover (porcentajes). */
  focalX?: number;
  focalY?: number;
  /** Variante/color mostrado, para comprobar que coincide con el producto. */
  variant?: string;
  externalId?: string;
  approvedAt?: string;
  approvedBy?: string;
}

/** Imagen candidata devuelta por un proveedor, pendiente de selección. */
export interface ImageCandidate {
  key: string;
  provider: ImageProviderId;
  externalId: string;
  title: string;
  description?: string;
  previewUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  license: LicenseCode;
  licenseName: string;
  licenseUrl?: string;
  author?: string;
  authorUrl?: string;
  sourceUrl: string;
  permissionNote?: string;
  /** Se debe enlazar desde el CDN del proveedor en vez de copiarla. */
  hotlink?: boolean;
  /** URL que hay que notificar al seleccionar (Unsplash download_location). */
  trackUrl?: string;
  usable: boolean;
  blockedReason?: string;
  /** Coincide con el contenido (modelo exacto o tema del artículo). */
  matched?: boolean;
  score: number;
  reasons: string[];
}

export type ImageTargetType = "post" | "phone" | "detected";

/** Resultado de una búsqueda de imágenes para un contenido concreto. */
export interface ImageSearch {
  id: ID;
  targetType: ImageTargetType;
  targetId: ID;
  query: string;
  createdAt: string;
  candidates: ImageCandidate[];
  /** Errores por proveedor (sin clave, bloqueado por red, límite de uso…). */
  errors: { provider: ImageProviderId; message: string }[];
  /** Origen de la búsqueda: automática (ingesta/cron) o manual desde el panel. */
  origin: "auto" | "manual";
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
  /** Colores comercializados (para descartar fotografías de otra variante). */
  colors?: string[];
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
  /**
   * La fuente concede permiso para reutilizar las imágenes de su feed
   * (p. ej. sala de prensa con condiciones verificadas). Por defecto, no.
   */
  imagesReusable?: boolean;
  imagePermissionNote?: string;
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
  /** Imagen incluida por la fuente en el feed (solo se usa si la fuente lo autoriza). */
  feedImage?: { url: string; credit?: string; copyright?: string; license?: string };
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
  meta?: ImageMeta;
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
  imageSearches: ImageSearch;
}

export type CollectionName = keyof Collections;
