import { adsActive, getSettings } from "@/lib/settings";
import { AdSlotClient } from "./AdSlotClient";

/**
 * Bloque manual de anuncio. Solo aparece si AdSense está activado en el panel y
 * se ha indicado el ID del bloque; si no, los anuncios automáticos de Google
 * deciden dónde colocarlos.
 */
export async function Ad({ slot, className = "" }: { slot: "home" | "article"; className?: string }) {
  const s = await getSettings();
  const slotId = s.slots[slot];
  if (!adsActive(s) || !/^\d{6,20}$/.test(slotId)) return null;
  return (
    <aside aria-label="Publicidad" className={className}>
      <p className="mb-2 text-center text-[11px] text-muted">Publicidad</p>
      <AdSlotClient client={s.adsenseClient} slotId={slotId} inArticle={slot === "article"} />
    </aside>
  );
}
