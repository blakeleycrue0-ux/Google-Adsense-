# Voltio — medio digital de tecnología

> Nombre provisional. Se cambia en **Panel → Ajustes** (nombre, lema y URL); el logotipo está en `src/components/site/Logo.tsx`.

Plataforma completa para un medio tecnológico: noticias con fuentes, última hora, buscador y comparador de móviles, guías de compra, ofertas, monetización con Google AdSense y afiliados, y un panel de administración privado.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · Geist · almacenamiento intercambiable (ficheros JSON o Supabase) · Zod · sharp.

---

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # opcional en desarrollo
npm run dev                  # http://localhost:3000
```

- La web arranca con **contenido de demostración** claramente señalado (aviso superior, etiquetas «Demo», precios «no verificados»).
- Panel: `http://localhost:3000/admin`. En desarrollo, la primera visita muestra un formulario para crear la cuenta de administración.
- `npm run data:reset` borra los datos locales y vuelve al contenido de demostración.
- Otros scripts: `npm run build`, `npm start`, `npm run lint`, `npm run typecheck`, `npm test` (pruebas unitarias), `npm run images:demo`.

## Dirección visual

- **Paleta:** blanco `#FFFFFF`, superficies `#F5F5F5`, texto secundario `#737373`, texto `#171717`, filetes `#E5E5E5`. Un único acento (rojo) reservado al indicador de «Última hora».
- **Tipografía:** Geist Sans para titulares (peso 650, interletraje negativo) y texto; Geist Mono en versalitas pequeñas para metadatos (categoría, hora, etiquetas). Esa combinación es la firma de la marca.
- **Estructura editorial:** filetes finos y reglas de 2 px sobre cada sección en lugar de tarjetas; radios de 2–6 px; sombras solo en elementos flotantes.
- **Secciones distintas entre sí:** portada asimétrica (principal 7/12 + secundaria y titulares), línea de tiempo para «Última hora», lista numerada para «Lo más leído», banda gris con pestañas por presupuesto para «¿Qué móvil comprar?», listado tipo tabla para ofertas.
- **Movimiento:** aparición suave de imágenes, subrayado animado en titulares, microinteracciones en botones, barra de progreso de lectura. Se respeta `prefers-reduced-motion`.

Los tokens están en `src/app/globals.css`.

## Arquitectura

```
src/
  app/
    (site)/            Web pública (portada, noticias, categorías, móviles, comparador, guías, ofertas, legal, contacto)
    admin/             Panel: login + (panel)/… protegido
    api/               search, views (lecturas), cron/ingest
    go/[id]            Redirección de enlaces de compra (afiliados + recuento de clics)
    uploads/[...path]  Sirve las imágenes subidas con el adaptador de ficheros
    sitemap.ts, robots.ts, feed.xml, news-sitemap.xml, ads.txt
  components/          site, news, phones, commerce, ads, consent, seo, admin, ui
  data/seed/           Contenido de demostración
  lib/
    db/                Adaptadores de almacenamiento (file | supabase)
    content.ts         Consultas públicas (publicados, más leídos, búsqueda…)
    ingest.ts          Detección RSS/Atom, duplicados y clasificación
    ai.ts              Asistente opcional de borradores (Claude)
    auth.ts            Sesiones firmadas (HMAC) y contraseñas scrypt
    seo.ts             Datos estructurados schema.org
  proxy.ts             Filtro rápido de /admin (la verificación real se hace en el servidor)
supabase/schema.sql    Esquema para producción
scripts/               Generador de ilustraciones de demostración
```

**Renderizado:** páginas públicas con ISR (revalidación cada 60 s) y revalidación inmediata de todo el sitio al guardar cualquier cambio en el panel. Las publicaciones programadas aparecen solas al llegar su hora.

## Almacenamiento

| Modo | Cuándo | Configuración |
|---|---|---|
| Ficheros JSON (`data/`) | Desarrollo, demo o un servidor con disco persistente (VPS, Docker con volumen) | `DATA_DIR` |
| Supabase | Producción y despliegues serverless (Vercel…) | Ejecuta `supabase/schema.sql` y define `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` |

La clave `service_role` solo se usa en el servidor; las tablas tienen RLS activado sin políticas públicas. Las imágenes se guardan en el bucket `media`. Si el disco es de solo lectura y no hay Supabase, el panel lo indica al guardar.

> El adaptador de Supabase cumple el mismo contrato que el de ficheros, pero no se ha probado contra un proyecto real: valida el esquema y una publicación de prueba antes de lanzar.

## Panel de administración

Artículos (borrador, revisión, programación, publicación, retirada, vista previa, SEO, fuentes) · Detección de noticias · Fuentes RSS · Categorías · Imágenes (WebP optimizado) · Fichas de móviles con precios por tienda · Guías · Ofertas · Enlaces de compra · Tiendas y afiliados · Estadísticas internas · Mensajes de contacto · Páginas legales · Publicidad · Ajustes · Usuarios.

- **Roles:** *Administración* (todo) y *Edición* (contenido y comercio; sin ajustes, publicidad, tiendas ni usuarios).
- **Seguridad:** cookie `httpOnly` firmada (7 días), contraseñas scrypt, límite de intentos de inicio de sesión, comprobación de sesión y rol en cada página y acción de servidor, `noindex` en `/admin`.
- **Primera cuenta en producción:** define `ADMIN_EMAIL` + `ADMIN_PASSWORD` (se crea al primer inicio de sesión) o `ADMIN_SETUP_TOKEN` para habilitar el formulario inicial. `SESSION_SECRET` es obligatorio.

## Detección de noticias

1. Añade fuentes RSS/Atom autorizadas en **Fuentes** (las de ejemplo vienen desactivadas: revisa sus condiciones de uso antes de activarlas).
2. Pulsa «Buscar novedades ahora» o usa el cron `GET /api/cron/ingest` con `Authorization: Bearer $CRON_SECRET` (`vercel.json` lo programa cada 30 min).
3. El sistema normaliza URLs, descarta lo ya visto, marca **duplicados probables** (similitud de titulares con otras fuentes y con artículos propios) y **sugiere categoría** por palabras clave.
4. Desde la cola se crea un **borrador** con la fuente enlazada. Con `ANTHROPIC_API_KEY`, opcionalmente un esquema generado con IA a partir del titular y el extracto (nunca del artículo completo), marcado para verificación.

Nada se publica automáticamente. Solo se almacenan titular, enlace, fecha y el extracto que publica la propia fuente.

## Imágenes con licencia

Las fotografías se gestionan en **Panel → Imágenes**. El sistema propone, comprueba y registra; nunca aprueba ni publica por sí solo.

**Fuentes admitidas**

| Fuente | Clave | Uso |
|---|---|---|
| Openverse | — (opcional `OPENVERSE_CLIENT_ID` / `OPENVERSE_CLIENT_SECRET` para más cuota) | Fuente principal: fotografías de Wikimedia Commons, Flickr y otros repositorios. Solo se piden licencias que permiten uso comercial y modificación. |
| Pexels | `PEXELS_API_KEY` (opcional) | Fotografía genérica para noticias. |
| Feeds RSS | — | Solo si marcas la fuente como autorizada (Fuentes → «La fuente autoriza reutilizar…») e indicas dónde consta el permiso. |
| Prensa / afiliación | — | «Imagen por URL» o subida, indicando el permiso. |
| Subida propia | — | Con licencia y autoría declaradas. |

**Reglas que aplica el sistema**

- Se descartan licencias no comerciales (NC), sin obras derivadas (ND) y desconocidas. No se copian imágenes de otros medios sin permiso.
- **Móviles:** la imagen debe mencionar el modelo exacto; se rechazan otros números de modelo, variantes (Pro, Ultra, Plus…), la versión 4G de un modelo 5G y colores que no se comercializan (campo «Colores» de la ficha).
- **Noticias:** relevancia por palabras clave del titular y etiquetas (traducidas al inglés para los bancos internacionales); resolución mínima de 1200 px de ancho y bonificación por proporción horizontal.
- Se guarda la procedencia, licencia, autoría, permiso, quién la aprobó y cuándo. La atribución se muestra junto a la imagen y en `/creditos-imagenes`.
- Las imágenes se optimizan a WebP (máx. 2400 px) y `next/image` genera los tamaños responsive; el punto focal elegido en el panel controla el recorte con `object-fit: cover`.
- La importación por URL valida el destino (sin redes privadas, sin redirecciones a ellas), el tipo y el tamaño.
- Un artículo nuevo no se puede publicar sin una imagen aprobada.

**Automatización:** tras cada detección RSS (botón o cron) se buscan propuestas para lo detectado y para contenidos pendientes. El borrador creado desde una noticia hereda su propuesta; basta con revisarla y pulsar «Aprobar propuesta». Si no hay ninguna imagen autorizada, el contenido queda pendiente de selección manual.

> Los proveedores requieren salida a internet hacia sus dominios. Si un proveedor no responde, el panel muestra el error real («Comprobar conexión»); nunca se simulan resultados.

## Despliegue en Netlify

El sitio `voltio0` se despliega desde la rama de producción configurada en Netlify. En Netlify:

- **Almacenamiento:** se usa Netlify Blobs automáticamente (contenido, ajustes, contadores e imágenes subidas). No hace falta ningún servicio externo. Las tiendas de Blobs son comunes a producción y a las previsualizaciones.
- **Búsquedas de imágenes:** se ejecutan en el backend de Netlify, que tiene salida a internet. Las claves solo existen como variables de entorno del sitio.
- **Automatización:** la función programada `voltio-cron` (cada hora, minuto 7 UTC) lanza la detección RSS y las propuestas de imágenes; `voltio-deploy-check` comprueba almacenamiento y proveedores tras cada despliegue de producción y deja el resultado en los registros con el prefijo `[voltio-diagnostico]`. Si una llamada se rechaza, el motivo aparece con el prefijo `[voltio-cron-auth]` (por ejemplo, falta `CRON_SECRET`). Las variables deben estar disponibles en el ámbito «Functions» y «Runtime», y se aplican en el siguiente despliegue.
- **Variables:** `SESSION_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` (primera cuenta); opcionales `PEXELS_API_KEY`, `OPENVERSE_CLIENT_ID` y `OPENVERSE_CLIENT_SECRET`.

## Monetización

### Google AdSense
- Configura el ID de editor (`ca-pub-…`) y los IDs de bloque por ubicación en **Panel → Publicidad** (o `NEXT_PUBLIC_ADSENSE_CLIENT`).
- Ubicaciones: portada (tras destacados y a mitad), artículo (dentro del texto y al final), barra lateral y listados. Cada espacio **reserva su altura** (sin saltos de maquetación) y lleva la etiqueta «Publicidad».
- Sin AdSense activo no se carga ningún script ni se muestra ningún hueco en la web pública; las ubicaciones quedan preparadas en el código.
- `ads.txt` se genera automáticamente con tu ID.

### Consentimiento (EEE)
- Google Consent Mode v2 con todo **denegado por defecto** y banner propio con «Rechazar» tan visible como «Aceptar». Analytics solo se carga tras aceptarlo.
- **Importante:** para servir anuncios de AdSense a usuarios del EEE, Reino Unido y Suiza, Google exige una **CMP certificada** integrada con el TCF. Usa el modo «CMP externa» en Ajustes y activa el mensaje de consentimiento del RGPD en AdSense → Privacidad y mensajes (o integra otra CMP certificada).

### Afiliados
- Todos los botones de compra apuntan a `/go/[id]` con `rel="sponsored nofollow"`. El destino y el código de afiliado se gestionan en el panel sin tocar el contenido.
- En **Tiendas y afiliados** se activa cada programa (p. ej. Amazon: parámetro `tag`) cuando la cuenta esté aprobada. Para redes que generan enlaces propios, pega el enlace completo y desactiva «Aplicar código».
- Aviso de afiliación junto a los botones, en el pie y en `/legal/publicidad-y-afiliados`. No se procesan compras en la web.

## SEO

Metadatos por página, canonical, Open Graph/Twitter, `sitemap.xml`, `news-sitemap.xml` (Google News, 48 h), `robots.txt`, RSS (`/feed.xml`), datos estructurados `NewsArticle`, `BreadcrumbList`, `ItemList`, `WebSite` (con SearchAction) y `NewsMediaOrganization`; `Product` solo cuando hay precios comprobados (nunca valoraciones inventadas). Verificación de Search Console y GA4 desde Ajustes.

**Modo demostración** (activo por defecto): añade `noindex` y bloquea `robots.txt` para que no se indexe contenido de prueba. Desactívalo en Ajustes al lanzar.

## Antes de publicar

El panel muestra esta lista con su estado real en **Resumen**:

1. Sustituir o eliminar los artículos de demostración e ilustraciones por contenido propio e imágenes con licencia.
2. Comprobar las especificaciones de las fichas y sustituir los precios de demostración por precios comprobados.
3. Completar los datos legales del titular y revisar con un profesional la privacidad, las cookies y el aviso legal.
4. Configurar `SESSION_SECRET`, Supabase y la URL pública; desactivar el modo demostración.
5. Solicitar AdSense con contenido original suficiente y configurar la CMP certificada.

## Despliegue

- **Vercel:** importa el repositorio, define las variables de `.env.example` (con Supabase) y despliega. El cron de detección se configura con `vercel.json`.
- **Servidor propio / Docker:** `npm ci && npm run build && npm start` con `DATA_DIR` en un volumen persistente (o Supabase).
