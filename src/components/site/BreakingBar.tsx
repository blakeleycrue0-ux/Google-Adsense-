import Link from "next/link";
import { formatTime } from "@/lib/format";
import type { Article } from "@/lib/types";

/** Franja negra con la última noticia marcada como «Última hora» (24 horas). */
export function BreakingBar({ items }: { items: Article[] }) {
  const a = items[0];
  if (!a) return null;
  return (
    <div className="bg-ink text-white">
      <Link href={`/noticia/${a.slug}`} className="container-x flex min-h-11 items-center gap-3 py-2 text-sm">
        <span className="kicker shrink-0 rounded-sm bg-white px-1.5 py-0.5 text-ink">Última hora</span>
        <span className="shrink-0 font-mono text-xs text-white/60">{formatTime(a.publishedAt!)}</span>
        <span className="min-w-0 truncate font-medium">{a.title}</span>
        {items.length > 1 && <span className="ml-auto hidden shrink-0 text-xs text-white/60 sm:inline">+{items.length - 1} más</span>}
      </Link>
    </div>
  );
}
