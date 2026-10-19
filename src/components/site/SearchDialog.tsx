"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CloseIcon, SearchIcon } from "@/components/ui/Icons";

interface Result {
  type: "post" | "phone";
  href: string;
  title: string;
  meta: string;
}

type State = { status: "idle" | "loading" | "done" | "error"; results: Result[] };

const SUGGESTIONS = ["USB-C", "Pixel", "Galaxy", "Inteligencia artificial", "Wi‑Fi 7", "Passkeys"];

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [fetched, setState] = useState<State>({ status: "idle", results: [] });
  const state: State = q.trim().length < 2 ? { status: "idle", results: [] } : fetched;
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { results: Result[] };
        setState({ status: "done", results: data.results });
        setActive(0);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setState({ status: "error", results: [] });
      }
    }, 160);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  if (!open) return null;

  const goAll = () => {
    if (q.trim()) router.push(`/buscar?q=${encodeURIComponent(q.trim())}`);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, state.results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const r = state.results[active];
      if (r) {
        router.push(r.href);
        onClose();
      } else goAll();
    }
  };

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Buscar" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-label="Cerrar búsqueda"
        className="absolute inset-0 bg-ink/25 backdrop-blur-[2px] animate-[fade-up_200ms_both]"
        onClick={onClose}
      />
      <div className="relative mx-auto mt-0 w-full max-w-2xl animate-fade-up bg-paper sm:mt-[12vh] sm:rounded-md sm:border sm:border-line sm:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <SearchIcon className="shrink-0 text-muted" width={20} height={20} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setState((s) => ({ ...s, status: "loading" }));
            }}
            placeholder="Buscar noticias, móviles, temas…"
            className="h-14 w-full bg-transparent text-[17px] outline-none placeholder:text-faint"
            aria-label="Término de búsqueda"
            aria-controls="search-results"
            aria-activedescendant={state.results[active] ? `sr-${active}` : undefined}
            autoComplete="off"
            enterKeyHint="search"
          />
          {state.status === "loading" && (
            <span className="size-4 shrink-0 animate-spin rounded-full border-[1.5px] border-line border-t-ink" aria-label="Cargando" />
          )}
          <button type="button" onClick={onClose} className="rounded-sm p-1.5 text-muted hover:bg-surface hover:text-ink" aria-label="Cerrar">
            <CloseIcon />
          </button>
        </div>

        <div id="search-results" role="listbox" className="max-h-[calc(100dvh-56px)] overflow-y-auto sm:max-h-[56vh]">
          {state.status === "idle" && (
            <div className="p-4">
              <p className="kicker text-muted">Búsquedas sugeridas</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setQ(s);
                      setState({ status: "loading", results: [] });
                    }}
                    className="h-8 rounded-sm border border-line px-3 text-[13px] transition-colors hover:border-ink"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {state.status === "error" && (
            <p className="p-6 text-[14px] text-muted">No se ha podido completar la búsqueda. Inténtalo de nuevo.</p>
          )}
          {state.status === "done" && state.results.length === 0 && (
            <div className="p-6">
              <p className="text-[15px] font-medium">Sin resultados para «{q.trim()}»</p>
              <p className="mt-1 text-[14px] text-muted">Prueba con otro término o revisa la ortografía.</p>
            </div>
          )}
          {state.results.length > 0 && (
            <ul className="py-2">
              {state.results.map((r, i) => (
                <li key={r.href} id={`sr-${i}`} role="option" aria-selected={i === active}>
                  <Link
                    href={r.href}
                    onClick={onClose}
                    onMouseEnter={() => setActive(i)}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${i === active ? "bg-surface" : ""}`}
                  >
                    <span className="kicker mt-1 w-14 shrink-0 text-faint">{r.type === "post" ? "Noticia" : "Móvil"}</span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-medium leading-snug">{r.title}</span>
                      <span className="mt-0.5 block text-[13px] text-muted">{r.meta}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {q.trim().length >= 2 && (
            <button
              type="button"
              onClick={goAll}
              className="flex w-full items-center justify-between border-t border-line px-4 py-3 text-[14px] font-medium hover:bg-surface"
            >
              Ver todos los resultados de «{q.trim()}»
              <ArrowRight />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
