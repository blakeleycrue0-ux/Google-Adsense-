import type { Metadata } from "next";
import { Photo } from "@/components/ui/Photo";
import Link from "next/link";
import { RowStory } from "@/components/news/Story";
import { SearchIcon } from "@/components/ui/Icons";
import { getCategoryMap, search } from "@/lib/content";
import { phoneHref, phoneName } from "@/lib/phones";

export const metadata: Metadata = {
  title: "Buscar",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: PageProps<"/buscar">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 100) ?? "";
  const [results, cats] = await Promise.all([q ? search(q) : Promise.resolve({ posts: [], phones: [] }), getCategoryMap()]);
  const total = results.posts.length + results.phones.length;

  return (
    <div className="container-x pt-10 sm:pt-14">
      <h1 className="headline text-[40px] sm:text-[52px]">Buscar</h1>
      <form action="/buscar" role="search" className="mt-6 flex max-w-2xl gap-2">
        <label htmlFor="q" className="sr-only">
          Término de búsqueda
        </label>
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input id="q" name="q" defaultValue={q} placeholder="Busca noticias o móviles…" className="field h-12 pl-10 text-[16px]" autoFocus={!q} />
        </div>
        <button className="btn-primary h-12">Buscar</button>
      </form>

      {q && (
        <p className="mt-6 text-[14px] text-muted" role="status">
          {total ? `${total} ${total === 1 ? "resultado" : "resultados"} para «${q}»` : `Sin resultados para «${q}».`}
        </p>
      )}

      {q && !total && (
        <div className="mt-8 max-w-2xl rounded-sm border border-dashed border-line-strong p-8">
          <p className="font-medium">Sugerencias</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-[14px] text-muted">
            <li>Comprueba la ortografía o usa términos más generales.</li>
            <li>
              Explora la <Link href="/ultima-hora" className="underline">última hora</Link> o el{" "}
              <Link href="/moviles" className="underline">buscador de móviles</Link>.
            </li>
          </ul>
        </div>
      )}

      <div className="mt-10 grid gap-14 lg:grid-cols-12">
        {results.posts.length > 0 && (
          <section className="lg:col-span-8" aria-labelledby="r-noticias">
            <h2 id="r-noticias" className="kicker border-t-2 border-ink pt-4 text-ink">
              Noticias · {results.posts.length}
            </h2>
            <div className="mt-6 divide-y divide-line">
              {results.posts.slice(0, 30).map((p) => (
                <div key={p.id} className="py-6 first:pt-0">
                  <RowStory post={p} category={cats.get(p.categoryId)} />
                </div>
              ))}
            </div>
          </section>
        )}
        {results.phones.length > 0 && (
          <section className="lg:col-span-4" aria-labelledby="r-moviles">
            <h2 id="r-moviles" className="kicker border-t-2 border-ink pt-4 text-ink">
              Móviles · {results.phones.length}
            </h2>
            <ul className="mt-4 divide-y divide-line">
              {results.phones.map((ph) => (
                <li key={ph.id}>
                  <Link href={phoneHref(ph)} className="group flex items-center gap-4 py-3">
                    <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xs bg-surface">
                      <Photo image={ph.image} alt="" fit="contain" sizes="48px" />
                    </span>
                    <span>
                      <span className="block font-medium">
                        <span className="link-title">{phoneName(ph)}</span>
                      </span>
                      <span className="text-[13px] text-muted">{ph.specs.chipset}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
