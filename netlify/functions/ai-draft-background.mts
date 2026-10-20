import { draftArticle } from "../../src/lib/ai";
import { writeJob } from "../../src/lib/db/job-writer";

/**
 * Función en segundo plano (hasta 15 min): redacta el borrador con IA sin el
 * límite de tiempo de las peticiones normales y deja el resultado en el
 * almacenamiento, donde el panel lo recoge. Protegida con STORE_SECRET.
 */
const handler = async (req: Request) => {
  const secret = process.env.STORE_SECRET || process.env.CRON_SECRET;
  if (req.method !== "POST" || !secret || req.headers.get("authorization") !== `Bearer ${secret}`) return;
  const { id, notes, island, section } = (await req.json()) as { id: string; notes: string; island: string; section: string };
  if (!/^ai_[a-z0-9]{16}$/.test(id)) return;
  const createdAt = new Date().toISOString();
  try {
    const draft = await draftArticle({ notes, island, section });
    await writeJob({ id, status: "done", draft, createdAt });
  } catch (e) {
    await writeJob({ id, status: "error", error: (e as Error).message.slice(0, 300), createdAt });
  }
};

export default handler;
