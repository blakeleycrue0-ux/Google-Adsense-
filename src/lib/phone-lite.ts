import "server-only";
import { getPhones, getStoreMap } from "@/lib/content";
import { lowestOffer } from "@/lib/phones";
import type { PhoneLite } from "@/components/phones/PhoneFinder";

export async function getPhoneLites(): Promise<PhoneLite[]> {
  const [phones, stores] = await Promise.all([getPhones(), getStoreMap()]);
  return phones.map((p) => {
    const o = lowestOffer(p);
    return {
      slug: p.slug,
      brand: p.brand,
      model: p.model,
      year: p.releaseYear,
      os: p.os,
      photo: p.image,
      price: o?.price ?? null,
      priceIsDemo: o?.source === "demo",
      storeName: o ? (stores.get(o.storeId)?.name ?? null) : null,
      inches: p.specs.displayInches,
      displayType: p.specs.displayType,
      refreshHz: p.specs.refreshHz,
      mainMp: p.specs.mainCameraMp,
      ultrawide: Boolean(p.specs.ultrawideMp),
      telephoto: p.specs.telephotoMp ? (p.specs.telephotoZoom ?? "sí") : null,
      battery: p.specs.batteryMah,
      charging: p.specs.chargingW ?? null,
      storage: p.specs.storageGB,
      tier: p.performanceTier,
      chipset: p.specs.chipset,
      ip: p.specs.ipRating ?? null,
      isDemo: Boolean(p.image.illustrative),
    };
  });
}
