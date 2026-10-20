import Link from "next/link";
import { formatSmart } from "@/lib/format";
import { islandName, sectionName } from "@/lib/site";
import type { Article } from "@/lib/types";
import { PhotoImage } from "./PhotoFigure";

export function Kicker({ article }: { article: Article }) {
  return (
    <p className="kicker flex flex-wrap items-center gap-x-2 text-sea">
      {article.breaking && <span className="rounded-sm bg-live px-1.5 py-0.5 text-white">Última hora</span>}
      <span>{islandName(article.island)}</span>
      <span className="text-muted">·</span>
      <span className="text-muted">{sectionName(article.section)}</span>
    </p>
  );
}

type Variant = "lead" | "card" | "row" | "compact";

/**
 * Noticia en listados. Variantes: principal de portada, tarjeta con foto,
 * fila con miniatura y titular compacto sin foto.
 */
export function ArticleCard({ article, variant = "card", priority }: { article: Article; variant?: Variant; priority?: boolean }) {
  const href = `/noticia/${article.slug}`;
  const time = <time dateTime={article.publishedAt} className="text-xs text-muted">{formatSmart(article.publishedAt!)}</time>;

  if (variant === "lead") {
    return (
      <article className="group">
        <Link href={href} className="block">
          <PhotoImage photo={article.photo} sizes="(min-width: 1024px) 700px, 100vw" priority={priority} className="rounded-md" />
          <div className="mt-4 space-y-2">
            <Kicker article={article} />
            <h2 className="headline text-3xl group-hover:text-sea sm:text-4xl">{article.title}</h2>
            <p className="text-lg text-ink-2">{article.summary}</p>
            {time}
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "row") {
    return (
      <article className="group">
        <Link href={href} className="flex gap-4">
          <PhotoImage photo={article.photo} sizes="160px" className="w-28 shrink-0 rounded sm:w-40" />
          <div className="min-w-0 space-y-1">
            <Kicker article={article} />
            <h3 className="headline text-base group-hover:text-sea sm:text-lg">{article.title}</h3>
            <p className="hidden text-sm text-ink-2 sm:line-clamp-2">{article.summary}</p>
            {time}
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group">
        <Link href={href} className="block space-y-1">
          <Kicker article={article} />
          <h3 className="headline text-base group-hover:text-sea">{article.title}</h3>
          {time}
        </Link>
      </article>
    );
  }

  return (
    <article className="group">
      <Link href={href} className="block">
        <PhotoImage photo={article.photo} sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" className="rounded-md" />
        <div className="mt-3 space-y-1.5">
          <Kicker article={article} />
          <h3 className="headline text-lg group-hover:text-sea">{article.title}</h3>
          <p className="line-clamp-2 text-sm text-ink-2">{article.summary}</p>
          {time}
        </div>
      </Link>
    </article>
  );
}

export function SectionTitle({ children, href }: { children: React.ReactNode; href?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between border-t-2 border-ink pt-2">
      <h2 className="text-xl font-bold tracking-tight">{children}</h2>
      {href && (
        <Link href={href} className="text-sm font-medium text-sea hover:underline">
          Ver más →
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-dashed border-line bg-surface px-6 py-12 text-center text-muted">{children}</p>;
}
