import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildOutboundUrl } from "@/lib/affiliate";
import { madridDayKey } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Redirección de enlaces de compra: aplica el parámetro de afiliado si el
 * programa está activo, registra el clic (contador interno) y redirige a la tienda.
 */
export async function GET(req: Request, ctx: RouteContext<"/go/[id]">) {
  const { id } = await ctx.params;
  const link = await db().get("links", id);
  if (!link || !link.active || !/^https:\/\//.test(link.targetUrl)) {
    return NextResponse.redirect(new URL("/ofertas", req.url), 302);
  }
  const store = await db().get("stores", link.storeId);
  const target = buildOutboundUrl(link, store);
  const ua = req.headers.get("user-agent") ?? "";
  if (!/bot|crawl|spider|preview/i.test(ua)) {
    await Promise.all([db().increment(`clicks:total:${id}`), db().increment(`clicks:d:${madridDayKey()}:${id}`)]).catch(() => {});
  }
  return NextResponse.redirect(target, {
    status: 302,
    headers: { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer-when-downgrade" },
  });
}
