import type { AffiliateLink, Store } from "@/lib/types";

/** Construye la URL final de la tienda con el parámetro de afiliado, si procede. */
export function buildOutboundUrl(link: AffiliateLink, store: Store | null) {
  const url = new URL(link.targetUrl);
  const aff = store?.affiliate;
  if (link.applyAffiliate && aff?.enabled && aff.param && aff.value) {
    url.searchParams.set(aff.param, aff.value);
  }
  return url.toString();
}
