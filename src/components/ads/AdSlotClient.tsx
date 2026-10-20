"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Bloque manual de AdSense. Reserva altura para evitar saltos de maquetación
 * (CLS) y empuja la unidad una sola vez. Nunca muestra anuncios simulados.
 */
export function AdSlotClient({ client, slotId, inArticle }: { client: string; slotId: string; inArticle?: boolean }) {
  const ref = useRef<HTMLModElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || el.dataset.pushed) return;
    el.dataset.pushed = "1";
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Script aún no cargado o bloqueador de anuncios: el espacio queda vacío.
    }
  }, []);

  return (
    <div className="min-h-[250px] w-full sm:min-h-[120px]">
      <ins
        ref={ref}
        className="adsbygoogle block"
        style={{ display: "block", textAlign: inArticle ? "center" : undefined }}
        data-ad-client={client}
        data-ad-slot={slotId}
        data-ad-format={inArticle ? "fluid" : "auto"}
        data-ad-layout={inArticle ? "in-article" : undefined}
        data-full-width-responsive={inArticle ? undefined : "true"}
      />
    </div>
  );
}
