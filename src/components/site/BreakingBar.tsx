import Link from "next/link";
import { formatTime } from "@/lib/format";
import type { Article } from "@/lib/types";

/** Cinta con las noticias marcadas como «Última hora» en las últimas 24 horas. */
export function BreakingBar({ items }: { items: Article[] }) {
  if (!items.length) return null;
  const list = items.slice(0, 8);
  // Se duplica la lista para que el desplazamiento sea continuo.
  const loop = [...list, ...list];
  return (
    <div className="border-b border-line bg-[#fff5f4]">
      <div className="container-x flex items-center gap-3 py-2">
        <Link href="/ultima-hora" className="kicker shrink-0 rounded-sm bg-live px-2 py-1 text-white">
          Última hora
        </Link>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <ul className="ticker-track flex w-max gap-8 text-sm">
            {loop.map((a, i) => (
              <li key={`${a.id}-${i}`} aria-hidden={i >= list.length || undefined} className="whitespace-nowrap">
                <Link href={`/noticia/${a.slug}`} tabIndex={i >= list.length ? -1 : undefined} className="hover:text-live">
                  <span className="mr-2 font-mono text-xs text-live">{formatTime(a.publishedAt!)}</span>
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
