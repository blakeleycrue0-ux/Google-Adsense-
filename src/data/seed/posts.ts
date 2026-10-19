import type { Post } from "@/lib/types";

// Contenido de demostración. Son piezas divulgativas (no noticias inventadas)
// redactadas para mostrar la maqueta; deben revisarse antes de publicar el sitio.

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();

type SeedPost = Omit<Post, "createdAt" | "updatedAt" | "status" | "authorId" | "cover" | "isDemo"> & {
  hours: number;
  coverAlt: string;
};

const seed: SeedPost[] = [
  {
    id: "post-usb-c-ue",
    slug: "usb-c-obligatorio-union-europea-que-dispositivos-afecta",
    title: "El USB-C ya es el cargador común en Europa: qué dispositivos afecta y desde cuándo",
    subtitle: "La directiva del cargador común se aplica a móviles desde finales de 2024 y a portátiles desde abril de 2026. Esto es lo que cambia al comprar.",
    categoryId: "cat-moviles",
    tags: ["USB-C", "Unión Europea", "carga"],
    hours: 2,
    isFeatured: true,
    coverAlt: "Ilustración de un conector USB-C sobre fondo gris claro",
    sources: [
      { title: "Directiva (UE) 2022/2380", url: "https://eur-lex.europa.eu/eli/dir/2022/2380/oj", publisher: "EUR-Lex" },
    ],
    body: `La Directiva (UE) 2022/2380 modificó la normativa europea de equipos radioeléctricos para que el USB-C sea el puerto de carga común. No es una recomendación: los fabricantes que quieran vender en la Unión deben cumplirla.

## Qué dispositivos están incluidos

Desde el **28 de diciembre de 2024**, la obligación se aplica a teléfonos móviles, tabletas, cámaras digitales, auriculares, cascos, consolas portátiles, altavoces portátiles, lectores de libros electrónicos, teclados, ratones, sistemas de navegación portátiles y auriculares inalámbricos que se carguen por cable.

Los **portátiles** tienen un plazo más amplio: la obligación les alcanza desde el **28 de abril de 2026**.

## Qué cambia al comprar

- **Puedes comprar sin cargador.** Los fabricantes deben ofrecer la opción de adquirir el dispositivo sin el adaptador de corriente.
- **Etiquetado de carga.** El embalaje debe indicar si incluye cargador y qué potencia necesita el dispositivo.
- **Carga rápida interoperable.** Si un aparato admite carga rápida por cable, debe ser compatible con USB Power Delivery, de modo que cualquier cargador que lo soporte funcione con él.

## Lo que no cambia

La norma se centra en la carga por cable. La carga inalámbrica no queda sustituida por esta obligación, y un cable USB-C sigue pudiendo diferir de otro en velocidad de datos o potencia máxima.

## Nuestro consejo

Antes de comprar un cargador nuevo, revisa la potencia que indica la etiqueta del dispositivo. En muchos casos, el adaptador USB-C que ya tienes en casa es suficiente.`,
  },
  {
    id: "post-ai-act-calendario",
    slug: "reglamento-europeo-inteligencia-artificial-fechas-clave",
    title: "Reglamento europeo de IA: las fechas clave de su aplicación",
    subtitle: "El AI Act entró en vigor en agosto de 2024, pero sus obligaciones se activan de forma escalonada. Repasamos el calendario y a quién afecta cada fase.",
    categoryId: "cat-ia",
    tags: ["AI Act", "regulación", "Unión Europea"],
    hours: 5,
    isFeatured: true,
    coverAlt: "Ilustración abstracta de una red de nodos en tonos grises",
    sources: [
      { title: "Reglamento (UE) 2024/1689 de Inteligencia Artificial", url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", publisher: "EUR-Lex" },
    ],
    body: `El Reglamento (UE) 2024/1689, conocido como AI Act, es la primera norma general sobre inteligencia artificial aprobada por la Unión Europea. Clasifica los sistemas según su nivel de riesgo y establece obligaciones distintas para cada categoría.

## Un calendario por fases

- **1 de agosto de 2024:** entrada en vigor del reglamento.
- **2 de febrero de 2025:** comienzan a aplicarse las prohibiciones de prácticas de riesgo inaceptable y las obligaciones de alfabetización en IA.
- **2 de agosto de 2025:** se aplican las obligaciones para los modelos de IA de uso general y las normas de gobernanza.
- **2 de agosto de 2026:** fecha general de aplicación para la mayor parte del reglamento.
- **2 de agosto de 2027:** plazo para los sistemas de alto riesgo integrados en productos ya regulados por otras normas europeas.

La Comisión Europea ha planteado ajustes sobre el calendario de algunas obligaciones, por lo que conviene consultar siempre la versión consolidada vigente.

## Qué está prohibido

El texto prohíbe, entre otras prácticas, los sistemas de puntuación social, la manipulación que explote vulnerabilidades de personas concretas y determinados usos de la identificación biométrica remota en tiempo real en espacios públicos, con excepciones tasadas.

## Qué significa para el usuario

Para quien usa asistentes o generadores de contenido, el cambio más visible será la **transparencia**: los sistemas que interactúan con personas deben informar de que se trata de una IA, y el contenido sintético debe poder identificarse como tal.

## Qué significa para las empresas

Quien desarrolle o despliegue sistemas de alto riesgo, como los usados en selección de personal o acceso a servicios esenciales, tendrá que documentar, evaluar y supervisar esos sistemas antes y después de ponerlos en el mercado.`,
  },
  {
    id: "post-passkeys",
    slug: "passkeys-que-son-como-activarlas",
    title: "Passkeys: qué son y por qué están sustituyendo a las contraseñas",
    subtitle: "Las llaves de acceso permiten iniciar sesión con la huella, la cara o el PIN del dispositivo. Son más cómodas y resisten el phishing.",
    categoryId: "cat-tecnologia",
    tags: ["seguridad", "passkeys", "contraseñas"],
    hours: 9,
    coverAlt: "Ilustración de una llave geométrica sobre fondo blanco",
    sources: [{ title: "Passkeys", url: "https://fidoalliance.org/passkeys/", publisher: "FIDO Alliance" }],
    body: `Una passkey, o llave de acceso, es una credencial basada en criptografía de clave pública. En lugar de memorizar una contraseña, el dispositivo guarda una clave privada que nunca sale de él y el servicio solo conoce la clave pública correspondiente.

## Cómo funcionan

Cuando inicias sesión, la web envía un desafío que tu dispositivo firma tras desbloquearlo con huella, reconocimiento facial o PIN. El servidor comprueba la firma con la clave pública. No hay ninguna contraseña que robar ni que reutilizar.

## Por qué resisten el phishing

Cada passkey está vinculada al dominio en el que se creó. Si una página falsa imita a tu banco, tu dispositivo no ofrecerá la llave porque el dominio no coincide.

## Dónde se guardan

Apple, Google y Microsoft integran las passkeys en sus sistemas y gestores de contraseñas, que pueden sincronizarlas entre tus dispositivos. También existen gestores de terceros compatibles y llaves de seguridad físicas.

## Cómo empezar

1. Entra en la configuración de seguridad de un servicio que las admita.
2. Busca la opción «Crear una llave de acceso» o «Passkey».
3. Confirma con el método de desbloqueo de tu dispositivo.

Mantén un método de recuperación alternativo por si pierdes el acceso a tus dispositivos.`,
  },
  {
    id: "post-npu",
    slug: "que-es-una-npu-procesadores-inteligencia-artificial",
    title: "Qué es una NPU y por qué todos los procesadores nuevos presumen de ella",
    subtitle: "La unidad de procesamiento neuronal se ha convertido en una cifra de marketing. Explicamos qué hace realmente y cómo interpretar los TOPS.",
    categoryId: "cat-ordenadores",
    tags: ["NPU", "procesadores", "IA en el dispositivo"],
    hours: 14,
    coverAlt: "Ilustración de un chip con una cuadrícula de circuitos",
    sources: [
      { title: "Introducing Copilot+ PCs", url: "https://blogs.microsoft.com/blog/2024/05/20/introducing-copilot-pcs/", publisher: "Microsoft" },
    ],
    body: `La NPU (Neural Processing Unit) es un bloque del procesador diseñado para ejecutar operaciones de redes neuronales, sobre todo multiplicaciones de matrices, con un consumo muy inferior al de la CPU o la GPU.

## Para qué sirve

Las tareas típicas son el desenfoque de fondo en videollamadas, la reducción de ruido del micrófono, la transcripción de voz, el reconocimiento de objetos en fotos o la ejecución de pequeños modelos de lenguaje sin conexión.

## Qué significan los TOPS

Los fabricantes expresan la potencia de la NPU en **TOPS** (billones de operaciones por segundo). Es una métrica útil para comparar dentro de una misma familia, pero no lo cuenta todo:

- Depende de la precisión numérica utilizada en la medición.
- No refleja el ancho de banda de memoria, que a menudo limita más que el cálculo.
- No garantiza que el software que usas aproveche la NPU.

Microsoft fijó en 2024 un mínimo de 40 TOPS en la NPU para que un portátil pueda venderse como Copilot+ PC.

## ¿La necesito?

Si tus aplicaciones no usan funciones de IA local, la NPU apenas influirá en tu experiencia. Puede ser relevante si trabajas con herramientas que ya la aprovechan o si valoras la autonomía en videollamadas largas.`,
  },
  {
    id: "post-etiqueta-energetica-moviles",
    slug: "etiqueta-energetica-moviles-tabletas-union-europea",
    title: "La etiqueta energética llega a los móviles: cómo leerla antes de comprar",
    subtitle: "Desde junio de 2025, los móviles y tabletas vendidos en la UE muestran clase energética, autonomía, ciclos de batería, resistencia y reparabilidad.",
    categoryId: "cat-moviles",
    tags: ["etiqueta energética", "reparabilidad", "Unión Europea"],
    hours: 20,
    coverAlt: "Ilustración de una etiqueta con barras de clasificación de la A a la G",
    sources: [
      { title: "Reglamento Delegado (UE) 2023/1669 sobre etiquetado energético", url: "https://eur-lex.europa.eu/eli/reg_del/2023/1669/oj", publisher: "EUR-Lex" },
      { title: "Reglamento (UE) 2023/1670 sobre diseño ecológico", url: "https://eur-lex.europa.eu/eli/reg/2023/1670/oj", publisher: "EUR-Lex" },
    ],
    body: `Desde el 20 de junio de 2025, los teléfonos móviles y las tabletas que se ponen a la venta en la Unión Europea deben llevar una etiqueta energética, similar a la de los electrodomésticos, y cumplir requisitos de diseño ecológico.

## Qué información aparece

- **Clase de eficiencia energética**, de la A a la G.
- **Autonomía por ciclo de carga**, en horas y minutos.
- **Ciclos de batería** que soporta manteniendo al menos el 80 % de su capacidad.
- **Resistencia a caídas** repetidas, en una escala de clases.
- **Índice de reparabilidad**, también por clases.
- **Grado de protección IP** frente a polvo y agua.

## Requisitos que no se ven en la etiqueta

El reglamento de diseño ecológico obliga, entre otras cosas, a ofrecer piezas de repuesto durante años tras el fin de la comercialización y a proporcionar actualizaciones del sistema operativo durante al menos cinco años desde que el modelo deja de venderse.

## Cómo usarla al comparar

La etiqueta es útil para comparar dos modelos de forma homogénea, porque todos se miden con los mismos métodos. Fíjate especialmente en los ciclos de batería y en la reparabilidad si piensas conservar el móvil varios años.`,
  },
  {
    id: "post-movil-300",
    slug: "como-elegir-movil-menos-300-euros",
    title: "Cómo elegir un móvil por menos de 300 euros sin equivocarte",
    subtitle: "En la gama media se concentran las mejores compras y también las trampas. Estas son las especificaciones que de verdad marcan la diferencia.",
    categoryId: "cat-moviles",
    tags: ["guía de compra", "gama media"],
    hours: 27,
    coverAlt: "Ilustración de tres siluetas de móviles alineadas",
    sources: [],
    body: `Por debajo de 300 euros hay móviles muy equilibrados, pero las fichas técnicas pueden despistar. Estos son los puntos en los que conviene fijarse.

## Años de actualizaciones

Es el dato que más influye en la vida útil. Algunos fabricantes anuncian varios años de actualizaciones de sistema y de seguridad incluso en gama media. Comprueba la política oficial del modelo concreto.

## Pantalla

Una pantalla OLED con 120 Hz se nota en el uso diario. El brillo máximo importa si usas el móvil a menudo en exteriores.

## Procesador y memoria

Para un uso normal, 8 GB de RAM ofrecen margen. Desconfía de las cifras de «RAM virtual»: usan almacenamiento interno y no equivalen a memoria real.

## Cámara

Los megapíxeles no lo son todo. Un sensor principal con estabilización óptica suele marcar más diferencia que los sensores macro o de profundidad de 2 MP, que en muchos modelos aportan poco.

## Batería y carga

5.000 mAh es una cifra habitual en esta gama. La carga rápida es cómoda, pero comprueba si el cargador va incluido en la caja.

## Resistencia

Una certificación IP67 o IP68 aporta tranquilidad. Muchos modelos económicos solo ofrecen protección frente a salpicaduras.

En nuestro [buscador de móviles](/moviles) puedes filtrar por todas estas características.`,
  },
  {
    id: "post-carga-rapida",
    slug: "carga-rapida-vatios-estandares-mitos",
    title: "Carga rápida: vatios, estándares y los mitos que conviene olvidar",
    subtitle: "USB Power Delivery, PPS, Qi2… La carga de los móviles se ha llenado de siglas. Te explicamos qué importa para no comprar cargadores de más.",
    categoryId: "cat-tecnologia",
    tags: ["carga rápida", "USB Power Delivery", "Qi2"],
    hours: 33,
    coverAlt: "Ilustración de un rayo estilizado sobre una cuadrícula",
    sources: [
      { title: "USB Charger (USB Power Delivery)", url: "https://www.usb.org/usb-charger-pd", publisher: "USB Implementers Forum" },
      { title: "Wireless Power Consortium", url: "https://www.wirelesspowerconsortium.com/", publisher: "WPC" },
    ],
    body: `La potencia de carga se mide en vatios (W), pero un número alto en la caja del cargador no garantiza que tu móvil cargue más rápido.

## El móvil decide

El teléfono negocia con el cargador la tensión y la corriente que acepta. Un cargador de 100 W no hará que un móvil limitado a 25 W cargue más deprisa, aunque tampoco lo dañará.

## Los estándares importantes

- **USB Power Delivery (USB PD):** el estándar común de carga rápida por USB-C.
- **PPS (Programmable Power Supply):** una extensión de USB PD que ajusta la tensión en pasos finos. Algunos fabricantes lo exigen para alcanzar su máxima velocidad.
- **Protocolos propietarios:** varias marcas usan sistemas propios que solo alcanzan su potencia máxima con su cargador.
- **Qi2:** el estándar de carga inalámbrica del Wireless Power Consortium, con alineación magnética.

## Mitos habituales

- **«Cargar por la noche estropea la batería».** Los móviles actuales gestionan la carga y muchos ofrecen modos de carga optimizada.
- **«Hay que agotar la batería antes de cargar».** Con baterías de iones de litio no es necesario ni recomendable.
- **«Cualquier cable sirve».** Para potencias altas, el cable debe estar certificado para esa corriente.`,
  },
  {
    id: "post-wifi7",
    slug: "wifi-7-que-mejora-cuando-cambiar-router",
    title: "Wi‑Fi 7: qué mejora de verdad y cuándo merece la pena cambiar de router",
    subtitle: "El nuevo estándar promete más velocidad y menos latencia, pero sus ventajas dependen de tus dispositivos y de la banda de 6 GHz.",
    categoryId: "cat-tecnologia",
    tags: ["Wi‑Fi 7", "redes", "router"],
    hours: 41,
    coverAlt: "Ilustración de ondas concéntricas en gris sobre blanco",
    sources: [{ title: "Wi-Fi CERTIFIED 7", url: "https://www.wi-fi.org/discover-wi-fi/wi-fi-certified-7", publisher: "Wi-Fi Alliance" }],
    body: `Wi‑Fi 7 es el nombre comercial del estándar IEEE 802.11be. Su objetivo no es solo la velocidad máxima, sino una conexión más estable con muchos dispositivos.

## Las novedades principales

- **Multi-Link Operation (MLO):** un dispositivo puede usar varias bandas a la vez, lo que reduce la latencia y mejora la estabilidad.
- **Canales de hasta 320 MHz** en la banda de 6 GHz.
- **Modulación 4096-QAM**, que transporta más datos por transmisión en buenas condiciones de señal.

## La letra pequeña en Europa

En la Unión Europea, la banda de 6 GHz disponible para Wi‑Fi es más estrecha que en otros mercados, lo que limita el número de canales anchos que pueden usarse a la vez.

## ¿Cuándo cambiar?

Tiene sentido si tu fibra supera claramente 1 Gbps, si tienes muchos dispositivos compatibles o si sufres congestión en zonas con muchas redes. Si tus móviles y portátiles no son compatibles con Wi‑Fi 7, notarás poca diferencia.`,
  },
  {
    id: "post-backup-movil",
    slug: "como-hacer-copia-seguridad-iphone-android",
    title: "Cómo hacer una copia de seguridad del móvil en iPhone y Android",
    subtitle: "Antes de cambiar de teléfono o actualizar, conviene asegurarse de que fotos, chats y ajustes están a salvo. Repasamos las opciones.",
    categoryId: "cat-apple",
    tags: ["copia de seguridad", "iPhone", "Android"],
    hours: 52,
    coverAlt: "Ilustración de una nube sobre un móvil con flechas de sincronización",
    sources: [
      { title: "Soporte de Apple", url: "https://support.apple.com/es-es", publisher: "Apple" },
      { title: "Ayuda de Android", url: "https://support.google.com/android", publisher: "Google" },
    ],
    body: `Una copia de seguridad actualizada es lo que separa un susto de una pérdida irreparable. Tanto iOS como Android incluyen sistemas propios.

## En iPhone

**Copia en iCloud:** en Ajustes, toca tu nombre, entra en iCloud y activa la copia de seguridad. Se realiza automáticamente cuando el iPhone está conectado a la corriente, bloqueado y con wifi. El espacio gratuito es limitado, por lo que quizá necesites ampliarlo.

**Copia en el ordenador:** puedes hacer una copia local desde el Finder en un Mac o desde la aplicación de Apple para dispositivos en Windows. Activa la opción de cifrar la copia para incluir contraseñas y datos de salud.

## En Android

**Copia de Google:** desde Ajustes, en el apartado de Google o de sistema según el fabricante, activa la copia de seguridad. Incluye aplicaciones, ajustes y, si lo configuras, fotos mediante Google Fotos.

**Herramientas del fabricante:** marcas como Samsung ofrecen sus propios sistemas de copia y migración.

## No olvides las aplicaciones de mensajería

Servicios como WhatsApp o Telegram gestionan sus propias copias. Revisa sus ajustes de chats y comprueba la fecha de la última copia.

## La regla 3-2-1

Para los archivos importantes: tres copias, en dos soportes distintos, una fuera de casa.`,
  },
  {
    id: "post-ray-tracing",
    slug: "que-es-ray-tracing-videojuegos",
    title: "Qué es el ray tracing y por qué cambia la imagen de los videojuegos",
    subtitle: "El trazado de rayos simula cómo se comporta la luz. Explicamos qué aporta, cuánto cuesta en rendimiento y qué técnicas lo hacen viable.",
    categoryId: "cat-videojuegos",
    tags: ["ray tracing", "gráficos", "GPU"],
    hours: 60,
    coverAlt: "Ilustración de rayos de luz reflejándose en esferas grises",
    sources: [{ title: "DirectX Developer Blog", url: "https://devblogs.microsoft.com/directx/", publisher: "Microsoft" }],
    body: `El ray tracing o trazado de rayos es una técnica de renderizado que calcula el recorrido de la luz: cómo rebota, se refleja o se bloquea al encontrar objetos.

## Rasterización frente a trazado de rayos

Durante décadas, los juegos han usado la **rasterización**, que proyecta los objetos 3D en la pantalla y aproxima la iluminación con trucos. El ray tracing produce reflejos, sombras e iluminación global más naturales, a cambio de un coste de cálculo muy superior.

## Por qué es viable ahora

Las tarjetas gráficas modernas incluyen hardware dedicado para acelerar estos cálculos. Además, los juegos combinan ambas técnicas: rasterizan la escena y usan ray tracing solo para reflejos, sombras o iluminación.

## El papel del escalado

Las técnicas de reescalado y generación de fotogramas renderizan a menor resolución y reconstruyen la imagen final. Son las que permiten activar el ray tracing manteniendo tasas de fotogramas jugables.

## ¿Merece la pena activarlo?

Depende del juego y de tu equipo. En títulos con mucha superficie reflectante el cambio es evidente. En otros, la diferencia es sutil y prima la fluidez.`,
  },
  {
    id: "post-reacondicionado",
    slug: "comprar-movil-reacondicionado-que-comprobar",
    title: "Móvil reacondicionado: qué comprobar para comprar con garantías",
    subtitle: "Un reacondicionado puede ahorrar dinero y residuos, pero no todos se venden en las mismas condiciones. Esta es la lista de comprobación.",
    categoryId: "cat-moviles",
    tags: ["reacondicionados", "garantía", "consumo"],
    hours: 74,
    coverAlt: "Ilustración de un móvil con una marca de verificación",
    sources: [
      { title: "Texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios", url: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555", publisher: "BOE" },
    ],
    body: `Un móvil reacondicionado es un dispositivo usado que ha sido revisado, reparado si era necesario y puesto de nuevo a la venta. La calidad depende mucho del vendedor.

## La garantía

En España, la garantía legal para bienes de segunda mano puede pactarse por un plazo menor que para productos nuevos, pero nunca inferior a un año cuando el vendedor es un profesional. Comprueba qué ofrece la tienda por escrito.

## El estado de la batería

Pregunta por el porcentaje de salud de la batería o si se ha sustituido. Es el componente que más se degrada.

## Grado estético

Las tiendas clasifican el aspecto con grados o etiquetas propias. No hay un estándar común, así que lee qué significa cada uno en esa tienda concreta.

## Piezas y bloqueo

- Asegúrate de que el móvil está libre de operador.
- Verifica que no está vinculado a una cuenta anterior.
- En algunos modelos, el sistema informa si se han usado piezas no originales.

## Actualizaciones

Comprueba cuántos años de soporte le quedan al modelo. Un precio bajo pierde atractivo si el móvil deja pronto de recibir parches de seguridad.`,
  },
  {
    id: "post-ia-en-el-movil",
    slug: "ia-en-el-movil-funciones-dispositivo-nube",
    title: "IA en el móvil: qué funciones se ejecutan en el dispositivo y cuáles en la nube",
    subtitle: "Resúmenes, edición de fotos o transcripciones: no todas las funciones de IA de tu teléfono funcionan igual ni tratan tus datos del mismo modo.",
    categoryId: "cat-ia",
    tags: ["IA", "privacidad", "móviles"],
    hours: 86,
    coverAlt: "Ilustración de un móvil conectado a una nube mediante líneas finas",
    sources: [
      { title: "Gemini Nano", url: "https://developer.android.com/ai/gemini-nano", publisher: "Android Developers" },
      { title: "Apple Intelligence", url: "https://www.apple.com/es/apple-intelligence/", publisher: "Apple" },
    ],
    body: `Los fabricantes han llenado sus móviles de funciones de inteligencia artificial. Algunas se procesan en el propio teléfono y otras se envían a servidores remotos.

## En el dispositivo

Los modelos pequeños que se ejecutan localmente permiten tareas como sugerencias de texto, resúmenes breves o transcripciones sin enviar los datos fuera del móvil. Google ofrece Gemini Nano para este tipo de usos en Android, y Apple prioriza el procesamiento local en Apple Intelligence.

**Ventajas:** funcionan sin conexión, responden rápido y los datos no salen del teléfono.
**Limitaciones:** los modelos son más pequeños y menos capaces.

## En la nube

Las tareas más exigentes, como generar imágenes complejas o responder preguntas largas, suelen requerir servidores. Cada fabricante describe en su política de privacidad cómo trata esos datos.

## Cómo saber qué ocurre

Revisa los ajustes de cada función: muchas indican si requieren conexión y permiten desactivar el procesamiento en la nube. Si manejas información sensible, prioriza las funciones locales.`,
  },
  {
    id: "post-portatil-estudiar",
    slug: "que-mirar-portatil-para-estudiar",
    title: "Qué mirar al comprar un portátil para estudiar",
    subtitle: "Peso, autonomía, pantalla y memoria: las prioridades cambian según la carrera, pero hay errores que conviene evitar siempre.",
    categoryId: "cat-ordenadores",
    tags: ["portátiles", "guía de compra", "estudiantes"],
    hours: 98,
    coverAlt: "Ilustración de un portátil abierto visto de perfil",
    sources: [],
    body: `Un portátil para estudiar pasa muchas horas fuera de casa. Por eso, el peso y la autonomía suelen importar más que la potencia bruta.

## Memoria y almacenamiento

Con 16 GB de RAM tendrás margen durante años. En almacenamiento, un SSD de 512 GB es un buen punto de partida si no trabajas con vídeo.

## Pantalla

Busca al menos resolución Full HD y un panel con buen brillo. Para leer y escribir durante horas, el formato 16:10 resulta más cómodo que el 16:9.

## Autonomía

Las cifras del fabricante se obtienen en condiciones favorables. Consulta pruebas independientes y descuenta un margen.

## Puertos y carga

La carga por USB-C permite usar un único cargador para el portátil y el móvil. Comprueba que tienes los puertos que necesitas sin depender de adaptadores.

## Según la carrera

- **Humanidades y ciencias sociales:** ligereza y teclado cómodo.
- **Ingenierías y ciencias:** comprueba los requisitos del software de tu titulación.
- **Diseño y audiovisuales:** pantalla con buena cobertura de color y una GPU acorde a las herramientas que usarás.`,
  },
  {
    id: "post-esim",
    slug: "esim-como-funciona-que-tener-en-cuenta",
    title: "eSIM: cómo funciona y qué tener en cuenta antes de pasarte",
    subtitle: "La SIM integrada simplifica el cambio de operador y permite usar varias líneas, pero el traspaso entre móviles requiere atención.",
    categoryId: "cat-android",
    tags: ["eSIM", "operadores", "conectividad"],
    hours: 110,
    coverAlt: "Ilustración de un chip de SIM integrado en una placa",
    sources: [{ title: "eSIM", url: "https://www.gsma.com/esim/", publisher: "GSMA" }],
    body: `La eSIM es una SIM integrada en el propio teléfono. En lugar de insertar una tarjeta, descargas el perfil del operador mediante un código QR o desde una aplicación.

## Ventajas

- **Cambio de operador sin esperar envíos.**
- **Varias líneas en el mismo móvil**, por ejemplo personal y de trabajo.
- **Viajes más sencillos**, con planes de datos locales que se contratan desde el teléfono.

## Lo que conviene saber

- **El cambio de móvil no siempre es automático.** Según el operador y el sistema, puede requerir solicitar una nueva eSIM.
- **Antes de restablecer el móvil de fábrica**, comprueba si se borrará el perfil y cómo recuperarlo.
- **No todos los dispositivos la admiten.** Revisa la compatibilidad de tu modelo y versión.

## Seguridad

Las eSIM no pueden extraerse físicamente del teléfono, lo que dificulta un tipo de robo de línea. Aun así, protege tu cuenta del operador con una contraseña robusta.`,
  },
];

export const posts: Post[] = seed.map(({ hours, coverAlt, ...p }) => ({
  ...p,
  authorId: "author-redaccion",
  status: "published",
  publishedAt: hoursAgo(hours),
  createdAt: hoursAgo(hours + 1),
  updatedAt: hoursAgo(hours),
  isDemo: true,
  cover: {
    src: `/demo/covers/${p.id.replace("post-", "")}.webp`,
    alt: coverAlt,
    credit: "Ilustración de demostración",
    illustrative: true,
    width: 1600,
    height: 1000,
  },
}));
