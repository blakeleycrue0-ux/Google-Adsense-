import Link from "next/link";
import { Ad } from "@/components/ads/Ad";
import { getCategories, getMostRead } from "@/lib/content";
import { postHref } from "./Story";

export async function ListingAside({ currentCategory }: { currentCategory?: string }) {
  const [{ posts }, categories] = await Promise.all([getMostRead(5), getCategories()]);
  return (
    <aside className="space-y-12">
      <div>
        <p className="kicker border-t-2 border-ink pt-4 text-ink">🔥 Lo más leído</p>
        <ol className="mt-3">
          {posts.map((p, i) => (
            <li key={p.id} className="border-b border-line last:border-0">
              <Link href={postHref(p)} className="group grid grid-cols-[28px_1fr] gap-2 py-3">
                <span className="font-mono text-[13px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[14px] font-medium leading-snug">
                  <span className="link-title">{p.title}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
      <nav aria-label="Secciones">
        <p className="kicker border-t-2 border-ink pt-4 text-ink">Secciones</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/categoria/${c.slug}`}
                aria-current={c.id === currentCategory ? "page" : undefined}
                className="inline-flex h-8 items-center rounded-sm border border-line px-3 text-[13px] transition-colors hover:border-ink aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-paper"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sticky top-[calc(var(--header-h)+24px)]">
        <Ad placement="sidebar" />
      </div>
    </aside>
  );
}
