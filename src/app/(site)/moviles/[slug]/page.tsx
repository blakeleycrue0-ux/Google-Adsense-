import type { Metadata } from "next";
import { Photo } from "@/components/ui/Photo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Ad } from "@/components/ads/Ad";
import { AffiliateNote } from "@/components/commerce/AffiliateNote";
import { BuyLink } from "@/components/commerce/BuyLink";
import { TextStory } from "@/components/news/Story";
import { CompareToggle } from "@/components/phones/CompareToggle";
import { JsonLd } from "@/components/seo/JsonLd";
import { DemoBadge } from "@/components/ui/Badge";
import { ImageCredit } from "@/components/ui/ImageCredit";
import { ArrowRight, ArrowUpRight, CheckIcon, MinusIcon } from "@/components/ui/Icons";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getCategoryMap, getDevices, getPhoneBySlug, getPhones, getStoreMap, search } from "@/lib/content";
import { approvedPhotos, slotLabel } from "@/lib/devices";
import { formatDate, formatPrice } from "@/lib/format";
import { TIER_LABEL, lowestOffer, phoneHref, phoneName } from "@/lib/phones";
import { breadcrumbLd, productLd } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import type { Phone } from "@/lib/types";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getPhones()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/moviles/[slug]">): Promise<Metadata> {
  const phone = await getPhoneBySlug((await params).slug);
  if (!phone) return { title: "Móvil no encontrado" };
  const name = phoneName(phone);
  return {
    title: `${name}: características, precio y alternativas`,
    description: phone.summary,
    alternates: { canonical: phoneHref(phone) },
    openGraph: { title: name, description: phone.summary, images: [{ url: phone.image.src, alt: phone.image.alt }] },
  };
}

function specRows(p: Phone) {
  const s = p.specs;
  const gb = (v: number) => (v >= 1024 ? `${v / 1024} TB` : `${v} GB`);
  return [
    {
      group: "Pantalla",
      rows: [
        ["Tamaño", `${s.displayInches.toLocaleString("es-ES")} pulgadas`],
        ["Tipo", s.displayType],
        ["Resolución", s.resolution],
        ["Frecuencia", `${s.refreshHz} Hz`],
      ],
    },
    {
      group: "Rendimiento",
      rows: [
        ["Procesador", s.chipset],
        ["Gama del procesador", `${TIER_LABEL[p.performanceTier]} (clasificación editorial)`],
        ["RAM", s.ramGB.map((r) => `${r} GB`).join(" / ")],
        ["Almacenamiento", s.storageGB.map(gb).join(" / ")],
      ],
    },
    {
      group: "Cámaras",
      rows: [
        ["Principal", `${s.mainCameraMp} MP`],
        ["Ultra gran angular", s.ultrawideMp ? `${s.ultrawideMp} MP` : "No"],
        ["Teleobjetivo", s.telephotoMp ? `${s.telephotoMp} MP · ${s.telephotoZoom ?? ""}` : "No"],
        ["Frontal", `${s.frontCameraMp} MP`],
      ],
    },
    {
      group: "Batería y carga",
      rows: [
        ["Capacidad", `${s.batteryMah.toLocaleString("es-ES")} mAh${p.os === "ios" ? " (dato no publicado por Apple; procede de registros regulatorios)" : ""}`],
        ["Carga por cable", s.chargingW ? `${s.chargingW} W` : "No especificada por el fabricante"],
      ],
    },
    {
      group: "Otros",
      rows: [
        ["Sistema operativo", p.os === "ios" ? "iOS" : "Android"],
        ["Actualizaciones anunciadas", s.osUpdatesYears ? `${s.osUpdatesYears} años` : "Sin compromiso público de años"],
        ["Resistencia", s.ipRating ?? "No especificada"],
        ["5G", s.fiveG ? "Sí" : "No"],
        ["Peso", `${s.weightG} g`],
        ["Año de lanzamiento", String(p.releaseYear)],
      ],
    },
  ];
}

export default async function PhonePage({ params }: PageProps<"/moviles/[slug]">) {
  const phone = await getPhoneBySlug((await params).slug);
  if (!phone) notFound();
  const [settings, stores, all, cats, devices] = await Promise.all([getSettings(), getStoreMap(), getPhones(), getCategoryMap(), getDevices()]);
  // Vistas adicionales (frontal y trasera) aprobadas en la biblioteca de fotos.
  const extraViews = approvedPhotos(phone.deviceId ? devices.get(phone.deviceId) : undefined).filter((v) => v.slot !== "main");
  const name = phoneName(phone);
  const alternatives = phone.alternativeIds.map((id) => all.find((p) => p.id === id)).filter(Boolean) as Phone[];
  const offers = [...phone.offers].sort((a, b) => a.price - b.price);
  const best = lowestOffer(phone);
  const related = (await search(phone.model)).posts.slice(0, 3);
  const verifiedOffers = offers.some((o) => o.source !== "demo");

  return (
    <>
      <JsonLd
        data={[
          ...(verifiedOffers ? [productLd(settings, phone, stores)] : []),
          breadcrumbLd(settings, [
            { name: "Inicio", path: "/" },
            { name: "Móviles", path: "/moviles" },
            { name, path: phoneHref(phone) },
          ]),
        ]}
      />

      <div className="container-x pt-8 sm:pt-12">
        <nav aria-label="Ruta" className="kicker flex gap-2 text-muted">
          <Link href="/" className="hover:text-ink">
            Inicio
          </Link>
          <span aria-hidden>/</span>
          <Link href="/moviles" className="hover:text-ink">
            Móviles
          </Link>
          <span aria-hidden>/</span>
          <span className="text-ink">{phone.brand}</span>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[calc(var(--header-h)+24px)]">
              <div className="relative mx-auto aspect-[4/5] max-w-[300px] overflow-hidden rounded-sm bg-surface sm:max-w-[380px] lg:max-w-none">
                <Photo image={phone.image} fit="contain" priority sizes="(min-width: 1024px) 480px, 320px" className="img-reveal p-6 sm:p-8" />
              </div>
              <p className="mt-2 text-center text-[12px] text-muted lg:text-left">
                {phone.image.illustrative ? "Ilustración genérica a la espera de una fotografía autorizada del modelo." : <ImageCredit image={phone.image} />}
              </p>
              {extraViews.length > 0 && (
                <div className="mx-auto mt-4 grid max-w-[300px] grid-cols-2 gap-3 sm:max-w-[380px] lg:max-w-none">
                  {extraViews.map((v) => (
                    <figure key={v.slot}>
                      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-surface">
                        <Photo image={v.image} fit="contain" sizes="(min-width: 1024px) 230px, 150px" className="p-3" />
                      </div>
                      <figcaption className="mt-1 text-[11px] text-muted">
                        {slotLabel(v.slot)} · <ImageCredit image={v.image} />
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="kicker flex items-center gap-2 text-muted">
              {phone.brand} · {phone.releaseYear} · {phone.os === "ios" ? "iOS" : "Android"}
              {phone.isDemo && <DemoBadge />}
            </p>
            <h1 className="headline mt-3 text-[40px] sm:text-[54px]">{name}</h1>
            <p className="pretty mt-4 text-[18px] leading-relaxed text-ink-2">{phone.summary}</p>

            {!phone.specsVerified && (
              <p className="mt-5 rounded-sm border border-dashed border-line-strong bg-surface px-4 py-3 text-[13px] text-muted">
                Especificaciones según información pública del fabricante, pendientes de verificación editorial.
                {phone.officialUrl && (
                  <>
                    {" "}
                    <a href={phone.officialUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
                      Ver web oficial
                    </a>
                    .
                  </>
                )}
              </p>
            )}

            {/* Dónde comprar */}
            <section aria-labelledby="donde-comprar" className="mt-10">
              <h2 id="donde-comprar" className="kicker border-t-2 border-ink pt-4 text-ink">
                Dónde comprarlo
              </h2>
              {offers.length ? (
                <ul className="mt-2 divide-y divide-line">
                  {offers.map((o) => {
                    const store = stores.get(o.storeId);
                    return (
                      <li key={o.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-4 sm:grid-cols-[1fr_auto_auto]">
                        <div>
                          <p className="font-medium">
                            {store?.name ?? "Tienda"}
                            {o.id === best?.id && offers.length > 1 && (
                              <span className="ml-2 rounded-xs bg-ink px-1.5 py-0.5 align-middle font-mono text-[10px] uppercase text-paper">Más bajo</span>
                            )}
                          </p>
                          <p className="text-[12px] text-muted">
                            {o.variant && `${o.variant} · `}
                            {o.source === "demo" ? "Precio de demostración, no verificado" : `Comprobado el ${formatDate(o.checkedAt)}`}
                          </p>
                        </div>
                        <p className="text-right text-[22px] font-semibold tracking-[-0.03em]">{formatPrice(o.price)}</p>
                        <BuyLink linkId={o.linkId} variant={o.id === best?.id ? "primary" : "secondary"} className="btn-sm col-span-2 sm:col-span-1">
                          Ver en {store?.name ?? "tienda"}
                        </BuyLink>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-4 text-[14px] text-muted">Aún no hemos añadido tiendas para este modelo.</p>
              )}
              <AffiliateNote className="mt-3" />
              <p className="mt-1 text-[12px] text-muted">Los precios pueden cambiar. Comprueba el precio final en la tienda antes de comprar.</p>
            </section>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CompareToggle slug={phone.slug} name={name} />
              {alternatives.length > 0 && (
                <Link
                  href={`/comparar?m=${[phone, ...alternatives.slice(0, 2)].map((p) => p.slug).join(",")}`}
                  className="inline-flex items-center gap-1.5 text-[14px] font-medium underline-offset-4 hover:underline"
                >
                  Comparar con sus alternativas <ArrowRight width={15} height={15} />
                </Link>
              )}
            </div>

            {/* Ventajas e inconvenientes */}
            <section className="mt-12 grid gap-8 sm:grid-cols-2" aria-label="Ventajas e inconvenientes">
              <div>
                <h2 className="kicker border-t-2 border-ink pt-4 text-ink">Ventajas</h2>
                <ul className="mt-4 space-y-2.5 text-[15px]">
                  {phone.pros.map((x) => (
                    <li key={x} className="flex gap-2.5">
                      <CheckIcon className="mt-0.5 shrink-0 text-ok" width={16} height={16} />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="kicker border-t-2 border-line-strong pt-4 text-ink">Inconvenientes</h2>
                <ul className="mt-4 space-y-2.5 text-[15px]">
                  {phone.cons.map((x) => (
                    <li key={x} className="flex gap-2.5 text-ink-2">
                      <MinusIcon className="mt-0.5 shrink-0 text-muted" width={16} height={16} />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
            <p className="mt-4 text-[12px] text-muted">
              Valoraciones basadas en la ficha técnica y en la comparación con modelos de su rango de precio. No son resultados de pruebas propias.
            </p>

            {/* Especificaciones */}
            <section className="mt-12" aria-labelledby="especificaciones">
              <h2 id="especificaciones" className="kicker border-t-2 border-ink pt-4 text-ink">
                Especificaciones
              </h2>
              <div className="mt-2">
                {specRows(phone).map((g) => (
                  <div key={g.group} className="grid gap-2 border-b border-line py-5 sm:grid-cols-[160px_1fr]">
                    <h3 className="text-[14px] font-semibold">{g.group}</h3>
                    <dl className="grid gap-y-2 text-[14px]">
                      {g.rows.map(([k, v]) => (
                        <div key={k} className="grid grid-cols-[140px_1fr] gap-3 sm:grid-cols-[180px_1fr]">
                          <dt className="text-muted">{k}</dt>
                          <dd>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
              {phone.officialUrl && (
                <a href={phone.officialUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink">
                  Fuente: web oficial de {phone.brand} <ArrowUpRight width={13} height={13} />
                </a>
              )}
            </section>
          </div>
        </div>
      </div>

      <Ad placement="listing" className="container-x mt-16" />

      {alternatives.length > 0 && (
        <section className="container-x mt-16" aria-labelledby="alternativas">
          <SectionHeader title="Alternativas" id="alternativas" description="Modelos de precio o características similares." />
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {alternatives.map((alt) => {
              const o = lowestOffer(alt);
              return (
                <li key={alt.id} className="group grid grid-cols-[96px_1fr] gap-4 border-b border-line pb-6">
                  <Link href={phoneHref(alt)} className="relative aspect-[4/5] overflow-hidden rounded-sm bg-surface">
                    <Photo image={alt.image} fit="contain" sizes="96px" className="p-1.5" />
                  </Link>
                  <div>
                    <p className="kicker text-muted">{alt.brand}</p>
                    <Link href={phoneHref(alt)} className="mt-1 block text-[17px] font-semibold tracking-[-0.02em]">
                      <span className="link-title">{phoneName(alt)}</span>
                    </Link>
                    <p className="mt-1 text-[13px] text-muted">
                      {alt.specs.displayInches.toLocaleString("es-ES")}″ · {alt.specs.batteryMah.toLocaleString("es-ES")} mAh · {alt.specs.chipset}
                    </p>
                    {o && (
                      <p className="mt-2 text-[14px] font-medium">
                        Desde {formatPrice(o.price)}
                        {o.source === "demo" && <span className="ml-1 text-[11px] font-normal text-muted">(demo)</span>}
                      </p>
                    )}
                    <Link href={`/comparar?m=${phone.slug},${alt.slug}`} className="mt-2 inline-block text-[13px] underline underline-offset-2 hover:text-ink">
                      Comparar con el {phone.model}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section className="container-x mt-16" aria-labelledby="relacionadas">
          <SectionHeader title={`Noticias sobre ${phone.model}`} id="relacionadas" />
          <ul className="mt-6 grid gap-6 sm:grid-cols-3">
            {related.map((p) => (
              <li key={p.id}>
                <TextStory post={p} category={cats.get(p.categoryId)} showSubtitle />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
