import type { Author, Category, NewsSource, Store } from "@/lib/types";

export const categories: Category[] = [
  { id: "cat-moviles", slug: "moviles", name: "Móviles", emoji: "📱", description: "Teléfonos, lanzamientos, guías de compra y todo lo que llevas en el bolsillo.", order: 1, inNav: true },
  { id: "cat-apple", slug: "apple", name: "Apple", description: "iPhone, iOS, Mac y el resto del ecosistema de Apple.", order: 2 },
  { id: "cat-android", slug: "android", name: "Android", description: "Samsung, Google, Xiaomi y el universo Android.", order: 3 },
  { id: "cat-ia", slug: "inteligencia-artificial", name: "Inteligencia artificial", emoji: "🤖", description: "Modelos, herramientas, regulación y el impacto real de la IA.", order: 4 },
  { id: "cat-ordenadores", slug: "ordenadores", name: "Ordenadores", emoji: "💻", description: "Portátiles, sobremesa, procesadores y periféricos.", order: 5 },
  { id: "cat-videojuegos", slug: "videojuegos", name: "Videojuegos", emoji: "🎮", description: "Consolas, PC gaming y la tecnología detrás de los juegos.", order: 6 },
  { id: "cat-tecnologia", slug: "tecnologia", name: "Tecnología", emoji: "⚡", description: "Conectividad, seguridad, regulación y tendencias.", order: 7, inNav: true },
];

export const authors: Author[] = [
  {
    id: "author-redaccion",
    slug: "redaccion",
    name: "Redacción",
    role: "Equipo editorial",
    bio: "Firma colectiva del equipo editorial. Cada pieza enlaza sus fuentes originales y se revisa antes de publicarse.",
  },
];

export const stores: Store[] = [
  { id: "store-amazon", name: "Amazon", domain: "amazon.es", affiliate: { program: "Amazon Afiliados", param: "tag", value: "", enabled: false } },
  { id: "store-pccomponentes", name: "PcComponentes", domain: "pccomponentes.com", affiliate: { program: "PcComponentes Afiliados", param: "", value: "", enabled: false } },
  { id: "store-mediamarkt", name: "MediaMarkt", domain: "mediamarkt.es" },
  { id: "store-elcorteingles", name: "El Corte Inglés", domain: "elcorteingles.es" },
  { id: "store-oficial", name: "Tienda oficial", domain: "" },
];

export const sources: NewsSource[] = [
  // Fuentes de ejemplo desactivadas: actívalas o sustitúyelas en el panel
  // tras confirmar que su uso es compatible con sus condiciones.
  { id: "src-xataka", name: "Xataka", feedUrl: "https://www.xataka.com/feedburner.xml", siteUrl: "https://www.xataka.com", language: "es", active: false },
  { id: "src-applesfera", name: "Applesfera", feedUrl: "https://www.applesfera.com/feedburner.xml", siteUrl: "https://www.applesfera.com", language: "es", defaultCategoryId: "cat-apple", active: false },
  { id: "src-theverge", name: "The Verge", feedUrl: "https://www.theverge.com/rss/index.xml", siteUrl: "https://www.theverge.com", language: "en", active: false },
  { id: "src-arstechnica", name: "Ars Technica", feedUrl: "https://feeds.arstechnica.com/arstechnica/index", siteUrl: "https://arstechnica.com", language: "en", active: false },
  { id: "src-google-blog", name: "Google Blog", feedUrl: "https://blog.google/rss/", siteUrl: "https://blog.google", language: "en", active: false },
  { id: "src-apple-newsroom", name: "Apple Newsroom", feedUrl: "https://www.apple.com/newsroom/rss-feed.rss", siteUrl: "https://www.apple.com/newsroom/", language: "en", defaultCategoryId: "cat-apple", active: false },
];
