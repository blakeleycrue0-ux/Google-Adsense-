import { promises as fs } from "node:fs";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/db/file-adapter";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".avif": "image/avif", ".gif": "image/gif" };

/** Sirve las imágenes subidas con el adaptador de ficheros locales. */
export async function GET(_: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path: parts } = await ctx.params;
  const target = path.join(UPLOAD_DIR, ...parts);
  const type = TYPES[path.extname(target).toLowerCase()];
  if (!target.startsWith(UPLOAD_DIR + path.sep) || !type) return new Response("No encontrado", { status: 404 });
  try {
    const data = await fs.readFile(target);
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
