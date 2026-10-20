# Recetario: web de recetas con panel privado

> «Recetario» es un nombre provisional. Se cambia en **Panel → Ajustes**.

Web personal de recetas de cocina, preparada para Google AdSense. Desde un panel privado (que funciona en el móvil) guardas tus recetas. Cada una puede ser **privada**, solo para ti, o **publicada** en la web.

**Tecnología:** Next.js 16 · Tailwind CSS 4 · Netlify (Netlify Blobs para recetas y fotos; Supabase opcional) · Claude (asistente opcional).

## Qué incluye

- **Web pública:**
  - Portada, todas las recetas y nueve categorías (entrantes, arroces y pastas, cuchara, carnes, pescados, verduras, salsas y fondos, panes y masas, postres).
  - Página de receta con ingredientes que se pueden tachar mientras cocinas, pasos numerados, tiempos, raciones, dificultad y consejos.
  - Botones de **Compartir** (menú del móvil o copiar enlace) e **Imprimir**.
  - Buscador por nombre e ingrediente, «Sobre mí», contacto y páginas legales.
- **Para Google:**
  - Datos estructurados `Recipe`, para que Google pueda mostrar la receta con foto y tiempo en sus resultados.
  - Migas de pan, sitemap (solo recetas publicadas), robots.txt y RSS.
  - `ads.txt` y etiqueta de verificación de AdSense.
- **Panel (`/admin`):**
  - Crear, editar, publicar, pasar a privada y borrar recetas.
  - Fotos desde el móvil: se reducen y se les quita la ubicación GPS.
  - Asistente de IA que ordena tus apuntes en ingredientes, pasos y tiempos.
  - Filtro y buscador de recetas, lista «Camino a AdSense» y ajustes con «Sobre mí» y redes sociales.
- **Reglas al publicar:** no se publica una receta sin presentación, ingredientes, al menos dos pasos y foto. Las privadas nunca aparecen en la web, en el sitemap ni en el buscador.

## Variables en Netlify

| Variable | Para qué |
|---|---|
| `SESSION_SECRET` | Firma las sesiones del panel (texto aleatorio de 40 caracteres o más) |
| `STORE_SECRET` (o `CRON_SECRET`) | Secreto interno entre la web y las funciones de Netlify |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Primera cuenta del panel (se crea al entrar por primera vez) |
| `STORAGE_DRIVER=netlify-blobs` | Guarda en Netlify Blobs |
| `ANTHROPIC_API_KEY` (opcional) | Asistente de IA |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (opcional) | Guardar en Supabase en lugar de Blobs (ejecuta antes `supabase/schema.sql`) |

## Cómo conseguir la aprobación de AdSense

1. **Publica 20-30 recetas propias** con foto tuya, ingredientes, pasos y algún consejo. AdSense rechaza las webs con poco contenido o contenido copiado.
2. Escribe el texto **Sobre mí** en Ajustes: quién eres, que estudias FP de cocina… Así Google sabe quién está detrás de la web.
3. Completa tus datos de **titular** (nombre, NIF, domicilio) y el **correo de contacto**. El aviso legal es obligatorio por ley.
4. **Usa un dominio propio** (.es o .com). Con `*.netlify.app` no se puede solicitar AdSense.
5. Da de alta la web en **Google Search Console**: pega el código en Ajustes y envía `/sitemap.xml`.
6. En AdSense, añade tu sitio, pega tu ID `ca-pub-…` en Ajustes y activa **Mostrar anuncios**. En AdSense, activa los **anuncios automáticos** y el **mensaje RGPD** (Privacidad y mensajes), que es el aviso de cookies.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000 (en /admin se crea la primera cuenta)
npm run typecheck && npm run lint && npm test && npm run build
```

Sin Netlify, los datos se guardan en `./data`.

## Etapas anteriores

La web empezó como diario de noticias. Las noticias que se guardaron siguen en el almacenamiento, sin tocar, pero ya no se muestran. Sus direcciones antiguas (`/noticia/…`, `/isla/…`, `/seccion/…`) llevan a la portada.
