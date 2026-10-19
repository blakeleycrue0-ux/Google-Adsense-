"use client";

import { useState } from "react";

/**
 * Selector de punto de interés: al pulsar sobre la imagen se guarda la posición
 * que usará object-fit: cover, y se previsualizan los recortes de la web.
 */
export function FocalPicker({ src, x = 50, y = 50, crops }: { src: string; x?: number; y?: number; crops: { label: string; ratio: string }[] }) {
  const [pos, setPos] = useState({ x, y });
  return (
    <div>
      <input type="hidden" name="focalX" value={Math.round(pos.x)} />
      <input type="hidden" name="focalY" value={Math.round(pos.y)} />
      <button
        type="button"
        className="relative block w-full cursor-crosshair overflow-hidden rounded-sm bg-surface"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        aria-label="Elegir el punto de interés de la imagen"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="block h-auto w-full" />
        <span
          className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        />
      </button>
      <p className="mt-1.5 text-[12px] text-muted">Pulsa sobre la zona más importante de la foto para centrar los recortes.</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {crops.map((c) => (
          <figure key={c.label} className="w-28">
            <div className="overflow-hidden rounded-xs bg-surface" style={{ aspectRatio: c.ratio }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${pos.x}% ${pos.y}%` }} />
            </div>
            <figcaption className="mt-1 text-[11px] text-muted">{c.label}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
