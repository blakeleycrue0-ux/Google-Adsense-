import { promises as fs } from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { UPLOAD_DIR } from "@/lib/db/file-adapter";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".avif": "image/avif", ".gif": "image/gif" };
const HEADERS = { "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" };

/** Sirve las imágenes subidas con los adaptadores sin URL pública propia (ficheros locales, Netlify Blobs). */
export async function GET(_: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path: parts } = await ctx.params;
  const rel = parts.join("/");
  const type = TYPES[path.extname(rel).toLowerCase()];
  if (!type || parts.some((p) => p === ".." || p.includes("\\"))) return new Response("No encontrado", { status: 404 });

  const adapter = db();
  if (adapter.readUpload) {
    const file = await adapter.readUpload(rel).catch(() => null);
    if (!file) return new Response("No encontrado", { status: 404 });
    return new Response(file.data, { headers: { "Content-Type": type, ...HEADERS } });
  }
  const target = path.join(UPLOAD_DIR, ...parts);
  if (!target.startsWith(UPLOAD_DIR + path.sep)) return new Response("No encontrado", { status: 404 });
  try {
    return new Response(new Uint8Array(await fs.readFile(target)), { headers: { "Content-Type": type, ...HEADERS } });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
