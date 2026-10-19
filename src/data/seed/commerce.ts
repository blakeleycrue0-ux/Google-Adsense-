import type { AffiliateLink, Deal, Guide } from "@/lib/types";

const seedDate = new Date().toISOString();

// Ofertas de DEMOSTRACIÓN: no reflejan precios reales ni descuentos. No se
// indica precio anterior porque no se ha verificado ninguno.
const demoDeals: { id: string; title: string; type: Deal["productType"]; store: string; price: number; q: string; phoneId?: string }[] = [
  { id: "deal-airpods-pro-2", title: "Apple AirPods Pro (2.ª generación) con estuche USB-C", type: "auriculares", store: "store-amazon", price: 229, q: "AirPods Pro 2 USB-C" },
  { id: "deal-sony-wh1000xm5", title: "Sony WH-1000XM5, auriculares inalámbricos con cancelación de ruido", type: "auriculares", store: "store-pccomponentes", price: 279, q: "Sony WH-1000XM5" },
  { id: "deal-galaxy-a56", title: "Samsung Galaxy A56 5G 8/128 GB", type: "movil", store: "store-mediamarkt", price: 429, q: "Galaxy A56 5G", phoneId: "ph-galaxy-a56" },
  { id: "deal-macbook-air-m4", title: "Apple MacBook Air 13\" con chip M4", type: "portatil", store: "store-elcorteingles", price: 1099, q: "MacBook Air M4" },
  { id: "deal-ipad-11", title: "Apple iPad 11\" (A16) 128 GB wifi", type: "tablet", store: "store-amazon", price: 379, q: "iPad A16 128GB" },
  { id: "deal-galaxy-watch", title: "Samsung Galaxy Watch, modelo Bluetooth de 40 mm", type: "reloj", store: "store-amazon", price: 249, q: "Galaxy Watch 40mm" },
];

const searchUrl: Record<string, (q: string) => string> = {
  "store-amazon": (q) => `https://www.amazon.es/s?k=${encodeURIComponent(q)}`,
  "store-pccomponentes": (q) => `https://www.pccomponentes.com/buscar/?query=${encodeURIComponent(q)}`,
  "store-mediamarkt": (q) => `https://www.mediamarkt.es/es/search.html?query=${encodeURIComponent(q)}`,
  "store-elcorteingles": (q) => `https://www.elcorteingles.es/search-nwx/1/?s=${encodeURIComponent(q)}`,
};

export const dealLinks: AffiliateLink[] = demoDeals.map((d) => ({
  id: `lnk-${d.id}`,
  label: d.title,
  storeId: d.store,
  targetUrl: searchUrl[d.store](d.q),
  active: true,
  applyAffiliate: true,
  createdAt: seedDate,
  updatedAt: seedDate,
}));

export const deals: Deal[] = demoDeals.map((d) => ({
  id: d.id,
  title: d.title,
  productType: d.type,
  storeId: d.store,
  price: d.price,
  linkId: `lnk-${d.id}`,
  checkedAt: seedDate,
  phoneId: d.phoneId,
  isDemo: true,
  active: true,
  image: {
    src: `/demo/deals/${d.type}.webp`,
    alt: `Ilustración genérica de ${d.type === "movil" ? "un móvil" : d.type === "portatil" ? "un portátil" : d.type === "reloj" ? "un reloj inteligente" : d.type === "tablet" ? "una tableta" : "unos auriculares"}`,
    illustrative: true,
    width: 600,
    height: 600,
  },
}));

export const guides: Guide[] = [
  {
    id: "guide-200",
    slug: "mejores-moviles-menos-200-euros",
    title: "Móviles por menos de 200 €",
    emoji: "💸",
    intro: "Qué se puede esperar de un móvil de entrada y qué modelos priorizan lo importante: batería, pantalla y años de soporte.",
    body: `En esta franja hay que elegir prioridades. Recomendamos fijarse primero en **los años de actualizaciones** y en la **batería**, y aceptar concesiones en cámara y potencia.

## Qué exigir

- Pantalla de al menos 90 Hz.
- Batería de 5.000 mAh.
- 128 GB de almacenamiento.
- Política de actualizaciones clara del fabricante.

## Qué no esperar

Cámaras secundarias útiles o rendimiento para juegos exigentes.`,
    maxPrice: 200,
    phoneIds: ["ph-galaxy-a16", "ph-moto-g85"],
    updatedAt: seedDate,
    isDemo: true,
    order: 1,
  },
  {
    id: "guide-300",
    slug: "mejores-moviles-menos-300-euros",
    title: "Móviles por menos de 300 €",
    emoji: "📱",
    intro: "La franja con mejor relación entre precio y prestaciones. Pantallas OLED de 120 Hz, buenas baterías y, a veces, resistencia al agua.",
    body: `Entre 200 y 300 € ya es razonable exigir **pantalla OLED de 120 Hz** y un procesador que no se quede corto en el día a día.

## Qué exigir

- Pantalla OLED de 120 Hz.
- 8 GB de RAM.
- Carga rápida de al menos 30 W.

## En qué fijarse

La certificación IP y el número de años de actualizaciones son lo que más diferencia a unos modelos de otros.`,
    maxPrice: 300,
    phoneIds: ["ph-moto-g85", "ph-galaxy-a16", "ph-redmi-note-14-pro"],
    updatedAt: seedDate,
    isDemo: true,
    order: 2,
  },
  {
    id: "guide-500",
    slug: "mejores-moviles-menos-500-euros",
    title: "Móviles por menos de 500 €",
    emoji: "⚖️",
    intro: "La gama media alta: resistencia IP67 o IP68, buenas cámaras principales y soporte de software durante muchos años.",
    body: `Por debajo de 500 € están algunos de los móviles más equilibrados del mercado.

## Qué exigir

- Certificación IP67 o IP68.
- Al menos cinco años de actualizaciones.
- Cámara principal con estabilización óptica.

## Dónde están las diferencias

En el teleobjetivo, la velocidad de carga y la calidad de la cámara en baja luz.`,
    maxPrice: 500,
    phoneIds: ["ph-pixel-9a", "ph-galaxy-a56", "ph-nothing-phone-3a", "ph-redmi-note-14-pro"],
    updatedAt: seedDate,
    isDemo: true,
    order: 3,
  },
  {
    id: "guide-alta",
    slug: "mejores-moviles-gama-alta",
    title: "Móviles de gama alta",
    emoji: "🚀",
    intro: "Teleobjetivos, procesadores de primer nivel y materiales premium. Qué aporta cada uno y cuándo compensa el precio.",
    body: `En la gama alta todos los modelos son rápidos. La elección depende del **sistema operativo**, del **tamaño** y de las **cámaras**.

## Preguntas que conviene hacerse

- ¿Necesitas teleobjetivo de largo alcance?
- ¿Prefieres un tamaño compacto?
- ¿Cuántos años piensas conservarlo?`,
    minPrice: 700,
    phoneIds: ["ph-galaxy-s25", "ph-pixel-9-pro", "ph-iphone-16-pro", "ph-galaxy-s25-ultra", "ph-xiaomi-15"],
    updatedAt: seedDate,
    isDemo: true,
    order: 4,
  },
];
