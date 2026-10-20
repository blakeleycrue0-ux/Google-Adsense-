# Brisa Balear: noticias de Baleares

> «Brisa Balear» es un nombre provisional. Se cambia en **Panel → Ajustes**.

Diario digital de noticias de Mallorca, Menorca, Ibiza y Formentera, preparado para Google AdSense. Tiene un panel privado para escribir noticias desde el móvil, con foto y un asistente de redacción con IA.

**Tecnología:** Next.js 16 · Tailwind CSS 4 · Netlify · Supabase (noticias, ajustes y fotos; sin Supabase se usa Netlify Blobs) · Claude (asistente opcional).

## Qué incluye

- **Web pública:** portada, última hora (con una cinta roja), páginas por isla y por sección, buscador y páginas de noticia con foto y crédito, fuentes y noticias relacionadas.
- **Para Google:** sitemap, sitemap de Google News, RSS, robots.txt, datos estructurados `NewsArticle`, `ads.txt` automático y etiqueta de verificación de AdSense.
- **Páginas legales:** aviso legal (LSSI), privacidad (con el texto que exige AdSense), cookies, quiénes somos, normas editoriales y contacto.
- **Panel (`/admin`):**
  - Escribir, publicar, retirar y borrar noticias.
  - Subir fotos desde el móvil. La foto se reduce antes de subirla y se guarda en WebP sin datos GPS.
  - Crédito obligatorio según el origen de la foto.
  - Asistente de IA que convierte tus notas o una nota de prensa en un borrador.
  - Lista «Camino a AdSense» y ajustes.

## Publicar en Netlify

1. **Supabase:** abre tu proyecto → **SQL Editor**, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**. Así se crean la tabla de noticias y el bucket público `media` para las fotos.
2. En Netlify, conecta este repositorio. El archivo `netlify.toml` ya contiene la configuración de compilación.
3. En **Site configuration → Environment variables**, crea estas variables (para todos los ámbitos):
   - `SUPABASE_URL`: `https://moailacnffcohjbsfoyd.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: en Supabase → **Project Settings → API Keys**, la clave `service_role` (o la *secret key*). Es secreta: no la pegues en ningún otro sitio.
   - `SESSION_SECRET` y `STORE_SECRET`: dos textos aleatorios largos, de 40 caracteres o más.
   - `ADMIN_EMAIL` y `ADMIN_PASSWORD`: tu cuenta del panel.
   - `ANTHROPIC_API_KEY` (opcional): activa el asistente de IA.
4. Despliega la web, entra en `https://tu-web/admin` y completa **Ajustes**: nombre, titular, NIF, domicilio y correo.

## Acceso al panel

- Dirección: `https://voltio0.netlify.app/admin` (o `tu-dominio/admin` cuando lo tengas).
- La primera vez se entra con `ADMIN_EMAIL` y `ADMIN_PASSWORD` de Netlify; la cuenta queda creada.
- Después cambia la contraseña en **Panel → Ajustes → Cambiar contraseña** (mínimo 10 caracteres).

## Fotos reales sin problemas de derechos

| Origen | Cuándo usarlo | Crédito |
|---|---|---|
| **Tus fotos** (móvil) | Siempre que puedas: es lo que más valoran Google y los lectores | «Foto: tu nombre» |
| **Notas de prensa oficiales** (Govern, ayuntamientos, Guardia Civil, Policía, 112, Consell) | Sucesos, obras, actos. Las difunden para que los medios las usen | «Foto: Guardia Civil» |
| **Wikimedia Commons** | Lugares conocidos: catedral, aeropuerto, playas, pueblos | Autor + licencia CC |
| **Unsplash / Pexels** | Imágenes genéricas: playa, tráfico, turistas, lluvia | «Foto: autor / Unsplash» |

Nunca uses fotos de otros periódicos ni de Google Imágenes, ni imágenes generadas con IA para hechos reales.

## Cómo conseguir la aprobación de AdSense

1. **Publica entre 30 y 40 noticias propias** antes de solicitarla, con textos de 250 palabras o más, foto y fuentes. El asistente de IA te ayuda, pero cada noticia tiene que llevar tu revisión y algún dato propio. AdSense rechaza las webs con contenido copiado o generado en masa.
2. **Usa un dominio propio** (`.es` o `.com`). Con `*.netlify.app` no se puede solicitar. Configúralo en Netlify y en Ajustes.
3. Rellena los datos del titular y el correo de contacto.
4. Da de alta la web en **Google Search Console**: pega el código en Ajustes y envía `/sitemap.xml`.
5. En AdSense, añade tu sitio y pega el ID `ca-pub-…` en Ajustes. La etiqueta de verificación y `ads.txt` se generan solos.
6. Activa **Mostrar anuncios** en Ajustes. En AdSense, activa los **anuncios automáticos** y el **mensaje RGPD** (Privacidad y mensajes). Ese mensaje es el aviso de cookies que exige la ley en Europa.
7. Publica a diario. La revisión de Google tarda entre unos días y unas semanas.

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:3000 (en /admin se crea la primera cuenta)
npm run typecheck && npm run lint && npm test
```

Sin Supabase ni Netlify, los datos se guardan en `./data`.

## Estructura

```
src/app/(site)/       Web pública
src/app/admin/        Panel privado
src/lib/              Almacenamiento, sesiones, IA, fotos, SEO
netlify/functions/    store (acceso a Blobs) y ai-draft-background (borradores de IA sin límite de tiempo)
```
