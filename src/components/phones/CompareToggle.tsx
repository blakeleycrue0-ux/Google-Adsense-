"use client";

import { CheckIcon, PlusIcon } from "@/components/ui/Icons";
import { MAX_COMPARE, useCompare } from "./compare-store";

export function CompareToggle({ slug, name, className = "" }: { slug: string; name: string; className?: string }) {
  const { has, toggle, full } = useCompare();
  const selected = has(slug);
  const disabled = !selected && full;
  return (
    <button
      type="button"
      onClick={() => toggle({ slug, name })}
      disabled={disabled}
      aria-pressed={selected}
      title={disabled ? `Máximo ${MAX_COMPARE} móviles` : undefined}
      className={`inline-flex h-8 items-center gap-1.5 rounded-sm border px-2.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        selected ? "border-ink bg-ink text-paper" : "border-line-strong hover:border-ink"
      } ${className}`}
    >
      {selected ? <CheckIcon width={14} height={14} /> : <PlusIcon width={14} height={14} />}
      {selected ? "En comparación" : "Comparar"}
    </button>
  );
}
