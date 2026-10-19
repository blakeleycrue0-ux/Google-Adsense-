import { Photo } from "@/components/ui/Photo";
import Link from "next/link";
import { Ad } from "@/components/ads/Ad";
import { AffiliateNote } from "@/components/commerce/AffiliateNote";
import { DealList } from "@/components/commerce/DealList";
import { Kicker, LeadStory, StackStory, TextStory, postHref } from "@/components/news/Story";
import { PhoneRow } from "@/components/phones/PhoneRow";
import { ArrowRight } from "@/components/ui/Icons";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tabs } from "@/components/ui/Tabs";
import {
  getCategoryMap,
  getDeals,
  getGuides,
  getMostRead,
  getPhones,
  getPublishedPosts,
  getStoreMap,
} from "@/lib/content";
import { formatDate, formatTime } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationLd, websiteLd } from "@/lib/seo";

export const revalidate = 60;

export default async function HomePage() {
  const [posts, cats, mostRead, phones, stores, guides, deals, settings] = await Promise.all([
    getPublishedPosts(),
    getCategoryMap(),
    getMostRead(5),
    getPhones(),
    getStoreMap(),
    getGuides(),
    getDeals(),
    getSettings(),
  ]);

  if (!posts.length) {
    return (
      <div className="container-x py-24 text-center">
        <h1 className="headline text-[40px]">Aún no hay noticias publicadas</h1>
        <p className="mt-3 text-muted">Publica el primer artículo desde el panel de administración.</p>
      </div>
    );
  }

  // Selección editorial: destacados primero, después lo más reciente.
  const featured = posts.filter((p) => p.isFeatured);
  const lead = featured[0] ?? posts[0];
  const pool = posts.filter((p) => p.id !== lead.id);
  const second = featured.find((p) => p.id !== lead.id) ?? pool[0];
  const rest = pool.filter((p) => p.id !== second.id);
  const headlines = rest.slice(0, 3);
  const latest = posts.slice(0, 7);
  const phoneById = new Map(phones.map((p) => [p.id, p]));

  const rails = ["cat-ia", "cat-ordenadores", "cat-tecnologia"]
    .map((id) => ({ cat: cats.get(id)!, items: posts.filter((p) => p.categoryId === id).slice(0, 3) }))
    .filter((r) => r.cat && r.items.length);

  return (
    <>
      <JsonLd data={[websiteLd(settings), organizationLd(settings)]} />
      <h1 className="sr-only">
        {settings.siteName}: noticias de tecnología, móviles y ofertas
      </h1>

      {/* ── Destacados ── */}
      <section aria-label="Noticias destacadas" className="container-x pt-6 sm:pt-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7 lg:border-r lg:border-line lg:pr-8">
            <LeadStory post={lead} category={cats.get(lead.categoryId)} />
          </div>
          <div className="flex flex-col gap-8 lg:col-span-5">
            {second && <StackStory post={second} category={cats.get(second.categoryId)} />}
            <ul className="divide-y divide-line border-t border-line">
              {headlines.map((p) => (
                <li key={p.id} className="py-4">
                  <TextStory post={p} category={cats.get(p.categoryId)} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Ad placement="home-after-hero" className="container-x mt-12" />

      {/* ── Última hora + Lo más leído ── */}
      <section className="container-x mt-14 grid gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-8">
          <SectionHeader emoji="⚡" title="Última hora" href="/ultima-hora" linkLabel="Toda la actualidad" />
          <ol className="mt-2">
            {latest.map((p, i) => (
              <li key={p.id} className="group relative grid grid-cols-[64px_1fr] gap-4 sm:grid-cols-[88px_1fr_120px] sm:gap-6">
                <div className="relative pt-5">
                  <time dateTime={p.publishedAt} className="block font-mono text-[13px] font-medium tabular-nums text-ink">
                    {formatTime(p.publishedAt!)}
                  </time>
                  <span className="mt-0.5 block font-mono text-[11px] text-faint">{formatDate(p.publishedAt!, { year: false })}</span>
                  {i < latest.length - 1 && <span aria-hidden className="absolute bottom-0 left-[3px] top-[60px] w-px bg-line" />}
                  <span aria-hidden className="absolute left-0 top-[46px] hidden size-[7px] rounded-full border border-ink bg-paper sm:block" />
                </div>
                <Link href={postHref(p)} className="block border-b border-line py-5 sm:col-span-1">
                  <p className="kicker text-muted">{cats.get(p.categoryId)?.name}</p>
                  <h3 className="mt-2 text-[17px] font-semibold leading-snug tracking-[-0.015em] sm:text-[19px]">
                    <span className="link-title">{p.title}</span>
                  </h3>
                </Link>
                <Link
                  href={postHref(p)}
                  tabIndex={-1}
                  aria-hidden
                  className="relative mt-5 hidden aspect-[4/3] overflow-hidden rounded-sm bg-surface sm:block"
                >
                  {p.cover.src && <Photo image={p.cover} alt="" sizes="120px" className="img-reveal transition-transform duration-700 group-hover:scale-[1.04]" />}
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <aside className="lg:col-span-4" aria-labelledby="mas-leido">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+24px)]">
            <SectionHeader emoji="🔥" title="Lo más leído" id="mas-leido" />
            <ol className="mt-2">
              {mostRead.posts.map((p, i) => (
                <li key={p.id} className="border-b border-line last:border-b-0">
                  <Link href={postHref(p)} className="group grid grid-cols-[40px_1fr] gap-3 py-4">
                    <span className="text-[34px] font-light leading-none tracking-[-0.05em] text-faint tabular-nums transition-colors group-hover:text-ink">
                      {i + 1}
                    </span>
                    <span>
                      <span className="block text-[15px] font-medium leading-snug tracking-[-0.01em]">
                        <span className="link-title">{p.title}</span>
                      </span>
                      <span className="kicker mt-2 block text-faint">{cats.get(p.categoryId)?.name}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[12px] leading-relaxed text-faint">
              {mostRead.ranked
                ? "Según las visitas reales de los últimos 7 días."
                : "Aún no hay datos de lectura suficientes: se muestran las piezas más recientes hasta que los haya."}
            </p>
            <Ad placement="sidebar" className="mt-8 hidden lg:block" />
          </div>
        </aside>
      </section>

      {/* ── ¿Qué móvil comprar? ── */}
      <section className="mt-20 bg-surface py-14 sm:py-16" aria-labelledby="que-movil">
        <div className="container-x">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="kicker text-muted">Guía de compra</p>
              <h2 id="que-movil" className="headline mt-3 text-[34px] sm:text-[44px]">
                <span aria-hidden className="mr-2 text-[0.8em]">📱</span>¿Qué móvil comprar?
              </h2>
              <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-muted">
                Selecciones por presupuesto con especificaciones, ventajas, inconvenientes y dónde consultar el precio.
                Sin puntuaciones inventadas.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:col-span-5 lg:justify-end">
              <Link href="/moviles" className="btn-primary">
                Buscador con filtros <ArrowRight width={16} height={16} />
              </Link>
              <Link href="/comparar" className="btn-secondary">
                Comparador
              </Link>
            </div>
          </div>

          <Tabs className="mt-10" labels={guides.map((g) => g.title.replace("Móviles ", "").replace(/^de /, ""))}>
            {guides.map((g) => (
              <div key={g.id} className="mt-6 rounded-md bg-paper px-5 sm:px-8">
                {g.phoneIds
                  .map((id) => phoneById.get(id))
                  .filter(Boolean)
                  .slice(0, 3)
                  .map((ph, i) => (
                    <PhoneRow key={ph!.id} phone={ph!} stores={stores} rank={i + 1} />
                  ))}
                <div className="flex flex-col gap-3 border-t border-line py-5 sm:flex-row sm:items-center sm:justify-between">
                  <AffiliateNote />
                  <Link href={`/comparativas/${g.slug}`} className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-medium">
                    Guía completa: {g.title.toLowerCase()} <ArrowRight width={15} height={15} />
                  </Link>
                </div>
              </div>
            ))}
          </Tabs>
        </div>
      </section>

      <Ad placement="home-mid" className="container-x mt-14" />

      {/* ── Ofertas ── */}
      <section className="container-x mt-16" aria-labelledby="ofertas">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeader emoji="🛍️" title="Ofertas tecnológicas" id="ofertas" />
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Solo publicamos descuentos que podemos comprobar: indicamos tienda, precio y fecha de comprobación. Si no
              hay precio anterior verificado, no mostramos porcentaje de descuento.
            </p>
            <Link href="/ofertas" className="btn-secondary mt-6">
              Todas las ofertas <ArrowRight width={16} height={16} />
            </Link>
          </div>
          <div className="lg:col-span-8">
            <DealList deals={deals.slice(0, 5)} stores={stores} />
            <AffiliateNote className="mt-4" />
          </div>
        </div>
      </section>

      {/* ── Secciones ── */}
      <section className="container-x mt-20" aria-label="Más secciones">
        <div className="grid gap-12 md:grid-cols-3 md:gap-8">
          {rails.map(({ cat, items }) => (
            <div key={cat.id}>
              <SectionHeader emoji={cat.emoji} title={cat.name} href={`/categoria/${cat.slug}`} linkLabel="Más" />
              <div className="mt-5">
                <article className="group">
                  <Link href={postHref(items[0])} className="block">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-surface">
                      {items[0].cover.src && (
                        <Photo
                          image={items[0].cover}
                          sizes="(min-width: 768px) 33vw, 100vw"
                          className="img-reveal transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      )}
                    </div>
                    <Kicker post={items[0]} className="mt-4" />
                    <h3 className="headline mt-2 text-[21px] leading-[1.15]">
                      <span className="link-title">{items[0].title}</span>
                    </h3>
                  </Link>
                </article>
                <ul className="mt-5 divide-y divide-line border-t border-line">
                  {items.slice(1).map((p) => (
                    <li key={p.id} className="py-3.5">
                      <TextStory post={p} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
