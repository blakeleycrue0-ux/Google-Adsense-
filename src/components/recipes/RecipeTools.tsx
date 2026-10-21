"use client";

import { useState } from "react";

/** Compartir (menú nativo del móvil o copiar enlace) e imprimir. */
export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia el enlace:", url);
    }
  }
  return (
    <div className="flex gap-2 print:hidden">
      <button type="button" onClick={share} className="btn btn-primary flex-1 sm:flex-none">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
        </svg>
        {copied ? "Enlace copiado" : "Compartir"}
      </button>
      <button type="button" onClick={() => window.print()} className="btn btn-ghost flex-1 sm:flex-none">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
        </svg>
        Imprimir
      </button>
    </div>
  );
}

/** Lista de ingredientes que se pueden ir tachando mientras se cocina. */
export function IngredientList({ groups }: { groups: { title: string; items: string[] }[] }) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const toggle = (key: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  return (
    <div className="space-y-5">
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.title && <h3 className="mb-1 mt-2 text-sm font-semibold text-ink">{g.title}</h3>}
          <ul className="divide-y divide-line">
            {g.items.map((item, i) => {
              const key = `${gi}-${i}`;
              const checked = done.has(key);
              return (
                <li key={key}>
                  <label className="flex cursor-pointer items-start gap-3 py-2.5">
                    <input type="checkbox" checked={checked} onChange={() => toggle(key)} className="mt-1 size-4 shrink-0 accent-sky print:hidden" />
                    <span className={checked ? "text-muted line-through" : ""}>{item}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
