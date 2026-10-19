import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPublishedPosts } from "@/lib/content";
import { madridDayKey } from "@/lib/format";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|embedly/i;

export async function POST(req: Request) {
  if (BOT.test(req.headers.get("user-agent") ?? "")) return new NextResponse(null, { status: 204 });
  if (!rateLimit(`views:${clientIp(req.headers)}`, 60, 60_000)) return new NextResponse(null, { status: 429 });
  let postId = "";
  try {
    postId = String(((await req.json()) as { postId?: unknown }).postId ?? "");
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const exists = (await getPublishedPosts()).some((p) => p.id === postId);
  if (!exists) return new NextResponse(null, { status: 404 });
  await Promise.all([
    db().increment(`views:d:${madridDayKey()}:${postId}`),
    db().increment(`views:total:${postId}`),
  ]);
  return new NextResponse(null, { status: 204 });
}
