import { NextResponse } from "next/server";
import { getCategoryMap, search } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { phoneHref, phoneName } from "@/lib/phones";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });
  const [{ posts, phones }, cats] = await Promise.all([search(q), getCategoryMap()]);
  const results = [
    ...phones.slice(0, 3).map((p) => ({ type: "phone", href: phoneHref(p), title: phoneName(p), meta: p.specs.chipset })),
    ...posts.slice(0, 7).map((p) => ({
      type: "post",
      href: `/noticias/${p.slug}`,
      title: p.title,
      meta: `${cats.get(p.categoryId)?.name ?? ""} · ${formatDate(p.publishedAt!)}`,
    })),
  ];
  return NextResponse.json({ results }, { headers: { "Cache-Control": "public, max-age=30" } });
}
