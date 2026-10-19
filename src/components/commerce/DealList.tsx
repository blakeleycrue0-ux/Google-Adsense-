import { Photo } from "@/components/ui/Photo";
import { DemoBadge } from "@/components/ui/Badge";
import { formatDate, formatPrice } from "@/lib/format";
import type { Deal, Store } from "@/lib/types";
import { BuyLink } from "./BuyLink";

const TYPE_LABEL: Record<Deal["productType"], string> = {
  movil: "Móvil",
  auriculares: "Auriculares",
  portatil: "Portátil",
  tablet: "Tableta",
  reloj: "Reloj",
  otro: "Otro",
};

export function DealList({ deals, stores }: { deals: Deal[]; stores: Map<string, Store> }) {
  if (!deals.length) {
    return (
      <div className="rounded-sm border border-dashed border-line-strong px-6 py-10 text-center">
        <p className="font-medium">No hay ofertas activas ahora mismo</p>
        <p className="mt-1 text-[14px] text-muted">Solo publicamos descuentos verificados. Vuelve pronto.</p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-line border-y border-line">
      {deals.map((d) => {
        const store = stores.get(d.storeId);
        const pct = d.previousPrice && d.previousPrice > d.price ? Math.round((1 - d.price / d.previousPrice) * 100) : null;
        return (
          <li key={d.id} className="group grid grid-cols-[64px_1fr] items-center gap-x-4 gap-y-3 py-4 sm:grid-cols-[72px_1fr_auto_auto] sm:gap-x-6">
            <div className="relative size-16 overflow-hidden rounded-sm bg-surface sm:size-[72px]">
              {d.image?.src && <Photo image={d.image} sizes="72px" className="img-reveal" />}
            </div>
            <div className="min-w-0">
              <p className="kicker flex flex-wrap items-center gap-2 text-muted">
                {TYPE_LABEL[d.productType]} · {store?.name}
                {d.isDemo && <DemoBadge label="Ejemplo demo" title="Oferta de demostración: precio no real" />}
              </p>
              <p id={d.id} className="mt-1.5 text-[15px] font-medium leading-snug">
                {d.title}
              </p>
              <p className="mt-1 text-[12px] text-muted">
                {d.isDemo ? "Precio de demostración, no verificado" : `Precio comprobado el ${formatDate(d.checkedAt)}`}
                {d.expiresAt && ` · válida hasta el ${formatDate(d.expiresAt)}`}
              </p>
            </div>
            <div className="col-start-2 flex items-baseline gap-2 sm:col-start-auto sm:block sm:text-right">
              <p className="text-[22px] font-semibold leading-none tracking-[-0.03em]">{formatPrice(d.price)}</p>
              {pct !== null && d.previousPrice && (
                <p className="mt-1 text-[12px] text-muted">
                  <span className="line-through">{formatPrice(d.previousPrice)}</span> · −{pct} %
                </p>
              )}
            </div>
            <div className="col-start-2 sm:col-start-auto">
              <BuyLink linkId={d.linkId} variant="secondary" className="btn-sm">
                Ver oferta
              </BuyLink>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
