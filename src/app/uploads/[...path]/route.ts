import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Sirve las fotos subidas desde el panel (ficheros locales o Netlify Blobs). */
export async function GET(_: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path: parts } = await ctx.params;
  if (!parts.at(-1)?.endsWith(".webp") || parts.some((p) => p === ".." || p.includes("\\"))) {
    return new Response("No encontrado", { status: 404 });
  }
  const file = await db()
    .readUpload(parts.join("/"))
    .catch(() => null);
  if (!file) return new Response("No encontrado", { status: 404 });
  return new Response(file.data, {
    headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
