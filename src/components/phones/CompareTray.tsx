"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloseIcon } from "@/components/ui/Icons";
import { MAX_COMPARE, useCompare } from "./compare-store";

/** Bandeja flotante con los móviles seleccionados para comparar. */
export function CompareTray() {
  const { items, remove, clear } = useCompare();
  const pathname = usePathname();
  if (!items.length || pathname.startsWith("/comparar")) return null;
  const href = `/comparar?m=${items.map((i) => i.slug).join(",")}`;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 animate-fade-up border-t border-line bg-paper/95 backdrop-blur-md sm:inset-x-auto sm:bottom-5 sm:left-1/2 sm:w-[min(720px,calc(100%-2rem))] sm:-translate-x-1/2 sm:rounded-md sm:border sm:shadow-[0_18px_50px_-24px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-3 p-3">
        <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {items.map((i) => (
            <span key={i.slug} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-sm bg-surface pl-2.5 pr-1 text-[13px]">
              {i.name}
              <button
                type="button"
                onClick={() => remove(i.slug)}
                className="rounded-xs p-1 text-muted hover:bg-surface-2 hover:text-ink"
                aria-label={`Quitar ${i.name}`}
              >
                <CloseIcon width={12} height={12} />
              </button>
            </span>
          ))}
          <span className="hidden shrink-0 items-center px-1 font-mono text-[11px] text-faint sm:inline-flex">
            {items.length}/{MAX_COMPARE}
          </span>
        </div>
        <button type="button" onClick={clear} className="btn-ghost btn-sm hidden sm:inline-flex">
          Vaciar
        </button>
        <Link
          href={href}
          aria-disabled={items.length < 2}
          className={`btn-primary btn-sm shrink-0 ${items.length < 2 ? "pointer-events-none opacity-40" : ""}`}
        >
          Comparar {items.length >= 2 ? `(${items.length})` : ""}
        </Link>
      </div>
      {items.length < 2 && <p className="px-3 pb-2 text-[12px] text-muted">Añade al menos otro móvil para comparar.</p>}
    </div>
  );
}
