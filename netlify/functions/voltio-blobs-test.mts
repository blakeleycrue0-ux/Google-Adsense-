import { getStore } from "@netlify/blobs";

/**
 * Prueba de Netlify Blobs fuera de Next.js: escribe, lee (consistencia fuerte y
 * eventual) y lista en una tienda aparte. Dentro del servidor de Next.js las
 * lecturas no responden; esta función dice si el problema es de Blobs o del
 * servidor de Next.js. El resultado se copia en los registros de peticiones del
 * sitio (/__prueba-blobs?...), que se pueden consultar sin acceso a los de funciones.
 */
const TIMEOUT = 5_000;

async function timed(label: string, fn: () => Promise<unknown>) {
  const t = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const r = await Promise.race([fn(), new Promise((_, rej) => (timer = setTimeout(() => rej(new Error("sin respuesta en 5 s")), TIMEOUT)))]);
    const ok = r === "voltio" || (typeof r === "object" && r !== null) || r === undefined;
    return `${label}=${ok ? "ok" : `valor ${String(r).slice(0, 20)}`} ${Date.now() - t}ms`;
  } catch (e) {
    return `${label}=error ${(e as Error).message.slice(0, 60)} ${Date.now() - t}ms`;
  } finally {
    clearTimeout(timer);
  }
}

export default async (req: Request) => {
  const strong = getStore({ name: "voltio-prueba", consistency: "strong" });
  const eventual = getStore({ name: "voltio-prueba" });
  const results = [
    await timed("escribir", () => strong.set("prueba-plana", "voltio")),
    await timed("escribir-con-barra", () => strong.set("carpeta/prueba", "voltio")),
    await timed("leer-fuerte", () => strong.get("prueba-plana")),
    await timed("leer-fuerte-con-barra", () => strong.get("carpeta/prueba")),
    await timed("leer-eventual", () => eventual.get("prueba-plana")),
    await timed("listar", () => strong.list({ prefix: "carpeta/" })),
  ];
  const summary = results.join(" · ");
  const ok = results.every((r) => r.includes("=ok"));
  const base = Netlify.env.get("URL") || new URL(req.url).origin;
  await fetch(`${base}/__prueba-blobs?ok=${ok ? 1 : 0}&r=${encodeURIComponent(summary)}`).catch(() => undefined);
  return new Response(summary, { status: ok ? 200 : 500 });
};
