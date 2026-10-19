import Image from "next/image";
import Link from "next/link";
import { formatSmart } from "@/lib/format";
import type { Category, Post } from "@/lib/types";

export const postHref = (p: Post) => `/noticias/${p.slug}`;

export function Cover({
  post,
  sizes,
  priority,
  className = "aspect-[3/2]",
}: {
  post: Post;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-sm bg-surface ${className}`}>
      <Image
        src={post.cover.src}
        alt={post.cover.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="img-reveal object-cover transition-transform duration-[900ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.025]"
      />
    </div>
  );
}

export function Kicker({ category, post, className = "" }: { category?: Category; post: Post; className?: string }) {
  return (
    <p className={`kicker flex flex-wrap items-center gap-x-2 gap-y-1 text-muted ${className}`}>
      {post.isBreaking && (
        <span className="inline-flex items-center gap-1.5 text-live">
          <span className="live-dot" aria-hidden />
          Última hora
        </span>
      )}
      {category && <span className="text-ink">{category.name}</span>}
      {post.publishedAt && (
        <time dateTime={post.publishedAt} className="text-muted">
          {formatSmart(post.publishedAt)}
        </time>
      )}
      {post.isDemo && <span className="rounded-xs border border-line px-1 py-0.5 text-[9px] text-faint">Demo</span>}
    </p>
  );
}

/** Noticia principal de portada. */
export function LeadStory({ post, category }: { post: Post; category?: Category }) {
  return (
    <article className="group">
      <Link href={postHref(post)} className="block">
        <Cover post={post} priority sizes="(min-width: 1024px) 720px, 100vw" className="aspect-[3/2]" />
        <Kicker post={post} category={category} className="mt-5" />
        <h2 className="headline mt-3 text-[34px] sm:text-[44px] lg:text-[52px]">
          <span className="link-title">{post.title}</span>
        </h2>
        <p className="pretty mt-4 max-w-[60ch] text-[17px] leading-relaxed text-ink-2">{post.subtitle}</p>
      </Link>
    </article>
  );
}

/** Noticia secundaria con imagen arriba. */
export function StackStory({ post, category, size = "md" }: { post: Post; category?: Category; size?: "md" | "sm" }) {
  return (
    <article className="group">
      <Link href={postHref(post)} className="block">
        <Cover post={post} sizes="(min-width: 1024px) 460px, 100vw" className="aspect-[16/10]" />
        <Kicker post={post} category={category} className="mt-4" />
        <h3
          className={`headline mt-2.5 ${size === "md" ? "text-[24px] sm:text-[26px]" : "text-[19px]"} leading-[1.12]`}
        >
          <span className="link-title">{post.title}</span>
        </h3>
        {size === "md" && <p className="pretty mt-2.5 line-clamp-2 text-[15px] leading-relaxed text-muted">{post.subtitle}</p>}
      </Link>
    </article>
  );
}

/** Titular sin imagen, para listas compactas. */
export function TextStory({ post, category, showSubtitle }: { post: Post; category?: Category; showSubtitle?: boolean }) {
  return (
    <article className="group">
      <Link href={postHref(post)} className="block">
        <Kicker post={post} category={category} />
        <h3 className="mt-2 text-[17px] font-semibold leading-snug tracking-[-0.015em] balance">
          <span className="link-title">{post.title}</span>
        </h3>
        {showSubtitle && <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-muted">{post.subtitle}</p>}
      </Link>
    </article>
  );
}

/** Fila horizontal con miniatura (listados y relacionados). */
export function RowStory({ post, category, priority }: { post: Post; category?: Category; priority?: boolean }) {
  return (
    <article className="group">
      <Link href={postHref(post)} className="grid grid-cols-[1fr_112px] items-start gap-4 sm:grid-cols-[220px_1fr] sm:gap-6">
        <Cover post={post} priority={priority} sizes="(min-width: 640px) 220px, 112px" className="aspect-[4/3] sm:order-none order-2" />
        <div className="min-w-0">
          <Kicker post={post} category={category} />
          <h3 className="headline mt-2 text-[18px] leading-[1.18] sm:text-[22px]">
            <span className="link-title">{post.title}</span>
          </h3>
          <p className="mt-2 hidden line-clamp-2 text-[15px] leading-relaxed text-muted sm:block">{post.subtitle}</p>
        </div>
      </Link>
    </article>
  );
}
