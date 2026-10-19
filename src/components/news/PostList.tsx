import Link from "next/link";
import { Ad } from "@/components/ads/Ad";
import type { Category, Post } from "@/lib/types";
import { RowStory } from "./Story";

export const PAGE_SIZE = 12;

export function PostList({
  posts,
  cats,
  page,
  basePath,
  query = {},
  emptyTitle = "No hay artículos todavía",
  emptyText = "Cuando se publiquen, aparecerán aquí.",
}: {
  posts: Post[];
  cats: Map<string, Category>;
  page: number;
  basePath: string;
  query?: Record<string, string>;
  emptyTitle?: string;
  emptyText?: string;
}) {
  const pages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);
  const slice = posts.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const href = (p: number) => {
    const qs = new URLSearchParams({ ...query, ...(p > 1 ? { pagina: String(p) } : {}) }).toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  if (!posts.length) {
    return (
      <div className="rounded-sm border border-dashed border-line-strong px-6 py-16 text-center">
        <p className="text-[17px] font-medium">{emptyTitle}</p>
        <p className="mt-1 text-[14px] text-muted">{emptyText}</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-line">
        {slice.map((p, i) => (
          <div key={p.id} className="py-6 first:pt-0">
            <RowStory post={p} category={cats.get(p.categoryId)} priority={i < 2} />
            {i === 5 && slice.length > 8 && <Ad placement="listing" className="mt-8" />}
          </div>
        ))}
      </div>
      {pages > 1 && (
        <nav aria-label="Paginación" className="mt-10 flex items-center justify-between border-t border-line pt-5 text-[14px]">
          {current > 1 ? (
            <Link href={href(current - 1)} className="btn-secondary btn-sm" rel="prev">
              ← Anteriores
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-[12px] text-muted">
            Página {current} de {pages}
          </span>
          {current < pages ? (
            <Link href={href(current + 1)} className="btn-secondary btn-sm" rel="next">
              Siguientes →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}

export function pageFrom(v: string | string[] | undefined) {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}
