import Image from "next/image";
import Link from "next/link";
import { BuyLink } from "@/components/commerce/BuyLink";
import { DemoBadge } from "@/components/ui/Badge";
import { CheckIcon, MinusIcon } from "@/components/ui/Icons";
import { formatDate, formatPrice } from "@/lib/format";
import { keySpecs, lowestOffer, phoneHref, phoneName } from "@/lib/phones";
import type { Phone, PriceOffer, Store } from "@/lib/types";
import { CompareToggle } from "./CompareToggle";

export function PriceSource({ offer, store }: { offer: PriceOffer; store?: Store }) {
  return (
    <p className="text-[12px] leading-snug text-muted">
      {offer.source === "demo" ? (
        <>Precio de demostración · no verificado</>
      ) : (
        <>
          {store?.name ?? "Tienda"} · comprobado el {formatDate(offer.checkedAt)}
        </>
      )}
    </p>
  );
}

/** Ficha horizontal de recomendación (portada y guías). */
export function PhoneRow({ phone, stores, rank }: { phone: Phone; stores: Map<string, Store>; rank?: number }) {
  const offer = lowestOffer(phone);
  const store = offer ? stores.get(offer.storeId) : undefined;
  return (
    <article className="group grid gap-5 border-t border-line py-6 first:border-t-0 sm:grid-cols-[140px_1fr] lg:grid-cols-[160px_1.25fr_1fr_200px] lg:gap-8">
      <Link href={phoneHref(phone)} className="relative block aspect-[4/5] w-[120px] overflow-hidden rounded-sm bg-paper sm:w-full">
        <Image
          src={phone.image.src}
          alt={phone.image.alt}
          fill
          sizes="160px"
          className="img-reveal object-contain p-2 transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.03]"
        />
        {rank && (
          <span className="absolute left-0 top-0 bg-ink px-1.5 py-0.5 font-mono text-[11px] text-paper">{String(rank).padStart(2, "0")}</span>
        )}
      </Link>

      <div className="min-w-0">
        <p className="kicker flex items-center gap-2 text-muted">
          {phone.brand} · {phone.releaseYear}
          {phone.isDemo && <DemoBadge />}
        </p>
        <h3 className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.025em]">
          <Link href={phoneHref(phone)} className="link-title">
            {phoneName(phone)}
          </Link>
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{phone.summary}</p>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
          {keySpecs(phone).map((s) => (
            <div key={s.label} className="min-w-0">
              <dt className="kicker text-faint">{s.label}</dt>
              <dd className="mt-1 truncate text-ink-2">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid grid-cols-2 gap-4 text-[13px] sm:col-start-2 lg:col-start-auto lg:grid-cols-1">
        <div>
          <p className="kicker text-faint">A favor</p>
          <ul className="mt-2 space-y-1.5">
            {phone.pros.slice(0, 3).map((x) => (
              <li key={x} className="flex gap-2">
                <CheckIcon width={14} height={14} className="mt-0.5 shrink-0 text-ok" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="kicker text-faint">En contra</p>
          <ul className="mt-2 space-y-1.5">
            {phone.cons.slice(0, 2).map((x) => (
              <li key={x} className="flex gap-2 text-ink-2">
                <MinusIcon width={14} height={14} className="mt-0.5 shrink-0 text-muted" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:col-start-2 lg:col-start-auto lg:items-stretch">
        {offer ? (
          <>
            <div>
              <p className="text-[12px] text-muted">Desde</p>
              <p className="text-[28px] font-semibold leading-none tracking-[-0.03em]">{formatPrice(offer.price)}</p>
              <div className="mt-1.5">
                <PriceSource offer={offer} store={store} />
              </div>
            </div>
            <BuyLink linkId={offer.linkId} className="w-full">
              Ver en {store?.name ?? "tienda"}
            </BuyLink>
          </>
        ) : (
          <p className="text-[13px] text-muted">Sin precios disponibles por ahora.</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <CompareToggle slug={phone.slug} name={phoneName(phone)} />
          <Link href={phoneHref(phone)} className="text-[13px] font-medium text-ink-2 underline-offset-4 hover:text-ink hover:underline">
            Ficha completa
          </Link>
        </div>
      </div>
    </article>
  );
}
