import Link from "next/link";
import { ArrowRight } from "./Icons";

export function SectionHeader({
  title,
  emoji,
  href,
  linkLabel = "Ver todo",
  description,
  as: Tag = "h2",
  id,
}: {
  title: string;
  emoji?: string;
  href?: string;
  linkLabel?: string;
  description?: string;
  as?: "h1" | "h2";
  id?: string;
}) {
  return (
    <div className="border-t-2 border-ink pt-4">
      <div className="flex items-baseline justify-between gap-4">
        <Tag id={id} className="text-[22px] font-semibold tracking-[-0.025em] sm:text-[26px]">
          {emoji && (
            <span className="mr-2 inline-block text-[0.85em]" aria-hidden>
              {emoji}
            </span>
          )}
          {title}
        </Tag>
        {href && (
          <Link
            href={href}
            className="group inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink"
          >
            {linkLabel}
            <ArrowRight width={15} height={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      {description && <p className="mt-1.5 max-w-2xl text-[15px] text-muted">{description}</p>}
    </div>
  );
}
