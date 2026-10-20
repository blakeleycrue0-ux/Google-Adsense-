import Link from "next/link";
import { formatSmart } from "@/lib/format";
import { islandName, sectionName } from "@/lib/site";
import type { Article } from "@/lib/types";
import { PhotoImage } from "./PhotoFigure";

/** Antetítulo en una sola línea: «ÚLTIMA HORA  MALLORCA · SUCESOS». */
export function Kicker({ article, light }: { article: Article; light?: boolean }) {
  return (
    <p className={`kicker flex min-w-0 items-center gap-2 ${light ? "text-white/70" : "text-muted"}`}>
      {article.breaking && <span className={`shrink-0 rounded-sm px-1.5 py-0.5 ${light ? "bg-white text-ink" : "bg-ink text-white"}`}>Última hora</span>}
      <span className="truncate">
        <span className={light ? "text-white" : "text-ink"}>{islandName(article.island)}</span> · {sectionName(article.section)}
      </span>
    </p>
  );
}

const Time = ({ article }: { article: Article }) => (
  <time dateTime={article.publishedAt} className="block text-xs text-muted">
    {formatSmart(article.publishedAt!)}
  </time>
);

/** Noticia principal: foto a todo el ancho en el móvil y titular grande. */
export function LeadStory({ article }: { article: Article }) {
  return (
    <article className="group">
      <Link href={`/noticia/${article.slug}`} className="block">
        {article.photo && (
          <PhotoImage photo={article.photo} sizes="(min-width: 1024px) 720px, 100vw" priority className="-mx-4 mb-4 sm:mx-0 sm:rounded-sm" />
        )}
        <div className="space-y-2.5">
          <Kicker article={article} />
          <h2 className="headline text-[1.85rem] group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4 sm:text-[2.6rem]">
            {article.title}
          </h2>
          <p className="text-[1.05rem] leading-relaxed text-ink-2 sm:text-lg">{article.summary}</p>
          <Time article={article} />
        </div>
      </Link>
    </article>
  );
}

/**
 * Noticia en listados. En el móvil: texto a la izquierda y miniatura a la
 * derecha. Desde tableta, en «card», foto arriba y texto debajo.
 */
export function ArticleCard({ article, variant = "card" }: { article: Article; variant?: "card" | "row" }) {
  const card = variant === "card";
  return (
    <article className="group">
      <Link href={`/noticia/${article.slug}`} className={`flex gap-4 ${card ? "sm:flex-col sm:gap-3" : ""}`}>
        {article.photo && (
          <PhotoImage
            photo={article.photo}
            sizes={card ? "(min-width: 1024px) 360px, (min-width: 640px) 50vw, 112px" : "128px"}
            aspect={card ? "aspect-square sm:aspect-[3/2]" : "aspect-square sm:aspect-[4/3]"}
            className={`order-2 w-24 shrink-0 rounded-sm sm:w-32 ${card ? "sm:order-1 sm:w-full" : ""}`}
          />
        )}
        <div className={`order-1 min-w-0 flex-1 space-y-1.5 ${card ? "sm:order-2" : ""}`}>
          <Kicker article={article} />
          <h3 className={`headline text-[1.08rem] group-hover:underline group-hover:underline-offset-2 ${card ? "sm:text-xl" : "sm:text-lg"}`}>
            {article.title}
          </h3>
          <p className={`hidden text-sm leading-relaxed text-ink-2 ${card ? "sm:line-clamp-3" : ""}`}>{article.summary}</p>
          <Time article={article} />
        </div>
      </Link>
    </article>
  );
}

export function SectionTitle({ children, href }: { children: React.ReactNode; href?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between border-t-[3px] border-ink pt-2.5">
      <h2 className="text-lg font-extrabold uppercase tracking-wide">{children}</h2>
      {href && (
        <Link href={href} className="text-sm text-muted hover:text-ink">
          Ver todo →
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="border-y border-line px-6 py-14 text-center text-muted">{children}</p>;
}
