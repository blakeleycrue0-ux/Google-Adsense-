import type { LegalPage } from "@/lib/types";

// Plantillas editables desde el panel. Los marcadores {{...}} se sustituyen por
// los datos de «Ajustes → Datos legales»; si están vacíos se muestra un aviso.
// Deben revisarse por un profesional antes de publicar el sitio.

const d = new Date().toISOString();

export const legalPages: LegalPage[] = [
  {
    id: "legal-sobre-nosotros",
    slug: "sobre-nosotros",
    title: "Sobre nosotros",
    updatedAt: d,
    needsLegalReview: false,
    body: `{{sitio}} es un medio digital dedicado a la tecnología: noticias, guías de compra y herramientas para elegir mejor.

## Cómo trabajamos

- **Fuentes primero.** Cada información enlaza a sus fuentes originales: comunicados oficiales, documentación técnica, normativa o medios de referencia.
- **Sin publicación automática.** Usamos herramientas para detectar novedades, pero ninguna pieza se publica sin revisión editorial.
- **Correcciones visibles.** Si cometemos un error, lo corregimos e indicamos la fecha de actualización.
- **Recomendaciones independientes.** Los enlaces de afiliado no deciden qué recomendamos. Lo explicamos en nuestra [política de publicidad y afiliados](/legal/publicidad-y-afiliados).

## Qué no hacemos

No publicamos análisis de productos que no hayamos probado ni inventamos resultados de pruebas. Cuando una ficha recoge especificaciones, indicamos su procedencia.

## Contacto

Puedes escribirnos desde la [página de contacto](/contacto).`,
  },
  {
    id: "legal-aviso-legal",
    slug: "aviso-legal",
    title: "Aviso legal",
    updatedAt: d,
    needsLegalReview: true,
    body: `## Datos identificativos

En cumplimiento de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), se informa de los datos del titular de este sitio web:

- **Titular:** {{titular}}
- **NIF/CIF:** {{nif}}
- **Domicilio:** {{direccion}}
- **Datos registrales:** {{registro}}
- **Correo electrónico:** {{email}}

## Objeto

Este sitio ofrece información sobre tecnología, guías de compra y enlaces a tiendas de terceros. No vende productos directamente.

## Propiedad intelectual

Los textos, diseños y elementos gráficos propios están protegidos. Las marcas y nombres de productos citados pertenecen a sus respectivos titulares y se usan con fines informativos.

## Responsabilidad

Los precios y la disponibilidad de los productos dependen de las tiendas enlazadas y pueden cambiar. Comprueba siempre las condiciones en la tienda antes de comprar.

## Legislación aplicable

Las relaciones con los usuarios se rigen por la normativa española y europea aplicable.`,
  },
  {
    id: "legal-privacidad",
    slug: "privacidad",
    title: "Política de privacidad",
    updatedAt: d,
    needsLegalReview: true,
    body: `## Responsable del tratamiento

- **Responsable:** {{titular}}
- **NIF/CIF:** {{nif}}
- **Dirección:** {{direccion}}
- **Contacto:** {{email}}

## Qué datos tratamos y para qué

| Tratamiento | Datos | Finalidad | Base jurídica |
|---|---|---|---|
| Formulario de contacto | Nombre, correo, mensaje | Responder a tu consulta | Consentimiento |
| Analítica (si la aceptas) | Datos de navegación seudonimizados | Medir audiencia | Consentimiento |
| Publicidad (si la aceptas) | Identificadores de dispositivo, cookies | Mostrar y medir anuncios | Consentimiento |
| Recuento interno de visitas | Identificador del artículo, sin datos personales | Ordenar «Lo más leído» | Interés legítimo |

## Destinatarios

Si aceptas las cookies correspondientes, pueden intervenir proveedores como Google (analítica y publicidad). Algunos pueden tratar datos fuera del Espacio Económico Europeo con las garantías previstas en el RGPD.

## Conservación

Los mensajes de contacto se conservan el tiempo necesario para atenderlos y, después, durante los plazos legales aplicables.

## Tus derechos

Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a {{email}}. También puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).`,
  },
  {
    id: "legal-cookies",
    slug: "cookies",
    title: "Política de cookies",
    updatedAt: d,
    needsLegalReview: true,
    body: `## Qué son las cookies

Son pequeños archivos que el sitio guarda en tu navegador para recordar información sobre tu visita.

## Cookies que utilizamos

| Tipo | Finalidad | ¿Requiere consentimiento? |
|---|---|---|
| Técnicas | Recordar tu elección de consentimiento y mantener la sesión del panel de administración | No |
| Analítica | Google Analytics: medir audiencia, solo si la activas | Sí |
| Publicidad | Google AdSense: mostrar y medir anuncios, solo si la activas | Sí |

## Cómo gestionar tu consentimiento

Puedes cambiar tu elección en cualquier momento desde el enlace «Preferencias de privacidad» del pie de página. También puedes borrar las cookies desde la configuración de tu navegador.

## Consent Mode

Mientras no aceptes las cookies de analítica o publicidad, las etiquetas de Google funcionan en modo denegado y no almacenan cookies con esas finalidades.`,
  },
  {
    id: "legal-publicidad",
    slug: "publicidad-y-afiliados",
    title: "Publicidad y enlaces de afiliado",
    updatedAt: d,
    needsLegalReview: true,
    body: `{{sitio}} se financia mediante publicidad y enlaces de afiliado. Queremos que sepas exactamente cómo funciona.

## Enlaces de afiliado

Algunos enlaces a tiendas son enlaces de afiliado. Si compras a través de ellos, podemos recibir una comisión según las condiciones del programa correspondiente, **sin que el precio cambie para ti**.

- Los enlaces de afiliado se identifican con el aviso «Enlace de afiliado» o con la nota que acompaña a los botones de compra.
- No procesamos pagos ni vendemos productos: la compra se realiza siempre en la tienda.
- Los precios y la disponibilidad pueden cambiar. Indicamos la fecha en la que se comprobó cada precio.

## Programas en los que participamos

{{programas}}

## Publicidad

Los anuncios se muestran en espacios señalizados con la etiqueta «Publicidad» y se separan del contenido editorial. No pedimos a nadie que haga clic en ellos.

## Independencia editorial

Las marcas no pagan por aparecer en nuestras guías ni revisan nuestros textos antes de publicarse. Si en el futuro publicamos contenido patrocinado, se identificará claramente como tal.`,
  },
];
