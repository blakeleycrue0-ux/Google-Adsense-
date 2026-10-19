import { adsActive, getSettings } from "@/lib/settings";
import type { AdPlacement } from "@/lib/types";
import { AdSlotClient } from "./AdSlotClient";

/**
 * Ubicación publicitaria configurable desde el panel (Ajustes → Publicidad).
 * - Activa y configurada: muestra la unidad de AdSense con la etiqueta «Publicidad».
 * - Inactiva con marcadores activados: muestra un hueco señalizado (solo maqueta).
 * - Inactiva sin marcadores: no renderiza nada.
 */
export async function Ad({ placement, className = "" }: { placement: AdPlacement; className?: string }) {
  const s = await getSettings();
  const slot = s.ads.slots[placement];
  const active = adsActive(s) && slot?.enabled && /^\d{6,20}$/.test(slot.slotId);

  if (!active) {
    if (!s.ads.showPlaceholders) return null;
    return (
      <aside aria-hidden="true" className={className}>
        <div className="flex min-h-[110px] flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-line-strong bg-[repeating-linear-gradient(135deg,transparent,transparent_8px,#fafafa_8px,#fafafa_16px)] px-4 text-center">
          <span className="kicker text-faint">Espacio publicitario reservado</span>
          <span className="text-[12px] text-faint">Inactivo · se activará cuando AdSense esté aprobado</span>
        </div>
      </aside>
    );
  }

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
