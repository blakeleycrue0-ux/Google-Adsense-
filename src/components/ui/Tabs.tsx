"use client";

import { useId, useRef, useState } from "react";

/** Pestañas accesibles: los paneles llegan ya renderizados desde el servidor. */
export function Tabs({ labels, children, className = "" }: { labels: string[]; children: React.ReactNode[]; className?: string }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + labels.length) % labels.length;
    setActive(next);
    refs.current[next]?.focus();
  };

  return (
    <div className={className}>
      <div role="tablist" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {labels.map((label, i) => (
          <button
            key={label}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`${id}-t${i}`}
            aria-selected={active === i}
            aria-controls={`${id}-p${i}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKey(e, i)}
            className="h-9 shrink-0 rounded-sm px-3.5 text-[14px] font-medium text-ink-2 transition-colors hover:text-ink aria-selected:bg-ink aria-selected:text-paper"
          >
            {label}
          </button>
        ))}
      </div>
      {children.map((panel, i) => (
        <div
          key={i}
          role="tabpanel"
          id={`${id}-p${i}`}
          aria-labelledby={`${id}-t${i}`}
          hidden={active !== i}
          className={active === i ? "animate-fade-up" : ""}
        >
          {panel}
        </div>
      ))}
    </div>
  );
}
