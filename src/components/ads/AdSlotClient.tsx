"use client";

import { useEffect, useRef } from "react";

const MIN_HEIGHT: Record<string, string> = {
  auto: "min-h-[250px] sm:min-h-[120px]",
  horizontal: "min-h-[100px] sm:min-h-[90px]",
  rectangle: "min-h-[250px]",
  fluid: "min-h-[200px]",
};

/**
 * Espacio de AdSense. Reserva su altura para evitar saltos de maquetación (CLS)
 * y empuja la unidad una sola vez. Nunca muestra anuncios simulados.
 */
export function AdSlotClient({
  client,
  slotId,
  format,
  layout = "default",
}: {
  client: string;
  slotId: string;
  format: "auto" | "fluid" | "rectangle" | "horizontal";
  layout?: "default" | "in-article";
}) {
  const ref = useRef<HTMLModElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || el.dataset.pushed) return;
    el.dataset.pushed = "1";
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // El script aún no está disponible o el bloqueador lo impide: el espacio queda vacío.
    }
  }, []);

  return (
    <div className={`w-full ${MIN_HEIGHT[format] ?? MIN_HEIGHT.auto}`}>
      <ins
        ref={ref}
        className="adsbygoogle block"
        style={{ display: "block", textAlign: layout === "in-article" ? "center" : undefined }}
        data-ad-client={client}
        data-ad-slot={slotId}
        data-ad-format={layout === "in-article" ? "fluid" : format === "rectangle" ? "rectangle" : format === "horizontal" ? "horizontal" : "auto"}
        data-ad-layout={layout === "in-article" ? "in-article" : undefined}
        data-full-width-responsive={format === "auto" ? "true" : undefined}
      />
    </div>
  );
}
