import { isBlobOp, runBlobOp } from "../../src/lib/db/blobs-ops";

/**
 * Acceso a Netlify Blobs para la web. Dentro del servidor de Next.js de Netlify
 * las lecturas de Blobs no responden; en una función independiente sí, así que
 * el adaptador hace aquí cada operación. Protegida con STORE_SECRET, que solo
 * conoce el servidor.
 */
const handler = async (req: Request) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });
  const secret = process.env.STORE_SECRET || process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("No autorizado", { status: 401 });
  let op: unknown;
  try {
    op = await req.json();
  } catch {
    return new Response("JSON no válido", { status: 400 });
  }
  if (!isBlobOp(op)) return new Response("Operación no válida", { status: 400 });
  try {
    return Response.json({ result: (await runBlobOp(op)) ?? null });
  } catch (e) {
    return Response.json({ error: (e as Error).message.slice(0, 300) }, { status: 500 });
  }
};

export default handler;
