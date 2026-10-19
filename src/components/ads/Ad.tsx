import { adsActive, getSettings } from "@/lib/settings";
import type { AdPlacement } from "@/lib/types";
import { AdSlotClient } from "./AdSlotClient";

/**
 * Ubicación publicitaria configurable desde el panel (Ajustes → Publicidad).
 * - Activa y configurada: muestra la unidad de AdSense con la etiqueta «Publicidad».
 * - Inactiva: no renderiza nada en la web pública.
 */
export async function Ad({ placement, className = "" }: { placement: AdPlacement; className?: string }) {
  const s = await getSettings();
  const slot = s.ads.slots[placement];
  const active = adsActive(s) && slot?.enabled && /^\d{6,20}$/.test(slot.slotId);

  // Sin AdSense activo no se muestra nada al público: el espacio queda preparado en el código.
  if (!active) return null;

  return (
    <aside aria-label="Publicidad" className={className}>
      <p className="kicker mb-2 text-center text-faint">Publicidad</p>
      <AdSlotClient
        client={s.ads.client}
        slotId={slot.slotId}
        format={slot.format}
        layout={placement === "article-inline" ? "in-article" : "default"}
      />
    </aside>
  );
}
