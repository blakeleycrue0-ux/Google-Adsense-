"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MAX_COMPARE, useCompare } from "./compare-store";

/** Selector para añadir o quitar modelos de la comparación actual (sincronizado con la URL). */
export function ComparePicker({ options, selected }: { options: { slug: string; name: string }[]; selected: string[] }) {
  const router = useRouter();
  const { clear, toggle } = useCompare();

  // La URL manda: sincroniza la bandeja con los modelos de la tabla.
  useEffect(() => {
    clear();
    selected.forEach((slug) => {
      const o = options.find((x) => x.slug === slug);
      if (o) toggle(o);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.join(",")]);

  const go = (slugs: string[]) => router.push(slugs.length ? `/comparar?m=${slugs.join(",")}` : "/comparar", { scroll: false });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="add-phone" className="sr-only">
        Añadir móvil
      </label>
      <select
        id="add-phone"
        className="field h-9 w-auto min-w-[220px] text-[14px]"
        value=""
        disabled={selected.length >= MAX_COMPARE}
        onChange={(e) => e.target.value && go([...selected, e.target.value])}
      >
        <option value="">{selected.length >= MAX_COMPARE ? `Máximo ${MAX_COMPARE} móviles` : "+ Añadir un móvil…"}</option>
        {options
          .filter((o) => !selected.includes(o.slug))
          .map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.name}
            </option>
          ))}
      </select>
      {selected.length > 0 && (
        <button type="button" className="btn-ghost btn-sm" onClick={() => go([])}>
          Empezar de nuevo
        </button>
      )}
    </div>
  );
}

export function RemoveFromCompare({ slug, selected }: { slug: string; selected: string[] }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        const rest = selected.filter((s) => s !== slug);
        router.push(rest.length ? `/comparar?m=${rest.join(",")}` : "/comparar", { scroll: false });
      }}
      className="text-[12px] text-muted underline-offset-2 hover:text-ink hover:underline"
    >
      Quitar
    </button>
  );
}
