"use client";

import { Photo } from "@/components/ui/Photo";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CloseIcon } from "@/components/ui/Icons";
import { TIER_LABEL, TIER_ORDER } from "@/lib/phones";
import type { ImageRef, OS, PerformanceTier } from "@/lib/types";
import { CompareToggle } from "./CompareToggle";

export interface PhoneLite {
  slug: string;
  brand: string;
  model: string;
  year: number;
  os: OS;
  photo: ImageRef;
  price: number | null;
  priceIsDemo: boolean;
  storeName: string | null;
  inches: number;
  displayType: string;
  refreshHz: number;
  mainMp: number;
  ultrawide: boolean;
  telephoto: string | null;
  battery: number;
  charging: number | null;
  storage: number[];
  tier: PerformanceTier;
  chipset: string;
  ip: string | null;
  isDemo: boolean;
}

type Filters = {
  max: number | null;
  brands: string[];
  os: OS | null;
  tele: boolean;
  mp50: boolean;
  uga: boolean;
  battery: number | null;
  tier: PerformanceTier | null;
  size: "compacto" | "grande" | null;
  hz120: boolean;
  storage: number | null;
  sort: "relevancia" | "precio-asc" | "precio-desc" | "bateria" | "reciente";
};

const BUDGETS = [200, 300, 500, 800, 1000];

function parse(sp: URLSearchParams): Filters {
  const num = (k: string) => (sp.get(k) && Number.isFinite(Number(sp.get(k))) ? Number(sp.get(k)) : null);
  const tier = sp.get("rendimiento") as PerformanceTier | null;
  return {
    max: num("max"),
    brands: sp.get("marca")?.split(",").filter(Boolean) ?? [],
    os: sp.get("so") === "ios" || sp.get("so") === "android" ? (sp.get("so") as OS) : null,
    tele: sp.get("tele") === "1",
    mp50: sp.get("mp50") === "1",
    uga: sp.get("uga") === "1",
    battery: num("bateria"),
    tier: tier && TIER_ORDER.includes(tier) ? tier : null,
    size: sp.get("tam") === "compacto" || sp.get("tam") === "grande" ? (sp.get("tam") as Filters["size"]) : null,
    hz120: sp.get("hz") === "120",
    storage: num("almacenamiento"),
    sort: (["precio-asc", "precio-desc", "bateria", "reciente"].includes(sp.get("orden") ?? "") ? sp.get("orden") : "relevancia") as Filters["sort"],
  };
}

function serialize(f: Filters) {
  const sp = new URLSearchParams();
  if (f.max) sp.set("max", String(f.max));
  if (f.brands.length) sp.set("marca", f.brands.join(","));
  if (f.os) sp.set("so", f.os);
  if (f.tele) sp.set("tele", "1");
  if (f.mp50) sp.set("mp50", "1");
  if (f.uga) sp.set("uga", "1");
  if (f.battery) sp.set("bateria", String(f.battery));
  if (f.tier) sp.set("rendimiento", f.tier);
  if (f.size) sp.set("tam", f.size);
  if (f.hz120) sp.set("hz", "120");
  if (f.storage) sp.set("almacenamiento", String(f.storage));
  if (f.sort !== "relevancia") sp.set("orden", f.sort);
  return sp.toString();
}

function apply(phones: PhoneLite[], f: Filters) {
  const list = phones.filter((p) => {
    if (f.max && (p.price === null || p.price > f.max)) return false;
    if (f.brands.length && !f.brands.includes(p.brand)) return false;
    if (f.os && p.os !== f.os) return false;
    if (f.tele && !p.telephoto) return false;
    if (f.mp50 && p.mainMp < 50) return false;
    if (f.uga && !p.ultrawide) return false;
    if (f.battery && p.battery < f.battery) return false;
    if (f.tier && TIER_ORDER.indexOf(p.tier) < TIER_ORDER.indexOf(f.tier)) return false;
    if (f.size === "compacto" && p.inches > 6.4) return false;
    if (f.size === "grande" && p.inches < 6.6) return false;
    if (f.hz120 && p.refreshHz < 120) return false;
    if (f.storage && !p.storage.some((s) => s >= f.storage!)) return false;
    return true;
  });
  const price = (p: PhoneLite) => p.price ?? Infinity;
  switch (f.sort) {
    case "precio-asc":
      return list.sort((a, b) => price(a) - price(b));
    case "precio-desc":
      return list.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    case "bateria":
      return list.sort((a, b) => b.battery - a.battery);
    case "reciente":
      return list.sort((a, b) => b.year - a.year);
    default:
      return list;
  }
}

function activeCount(f: Filters) {
  return [f.max, f.brands.length, f.os, f.tele, f.mp50, f.uga, f.battery, f.tier, f.size, f.hz120, f.storage].filter(Boolean).length;
}

export function PhoneFinder({ phones }: { phones: PhoneLite[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [drawer, setDrawer] = useState(false);
  const f = useMemo(() => parse(new URLSearchParams(sp.toString())), [sp]);
  const results = useMemo(() => apply([...phones], f), [phones, f]);
  const brands = useMemo(() => [...new Set(phones.map((p) => p.brand))].sort(), [phones]);
  const count = activeCount(f);

  const update = (patch: Partial<Filters>) => {
    const qs = serialize({ ...f, ...patch });
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  const reset = () => startTransition(() => router.replace(pathname, { scroll: false }));

  const panel = (
    <div className="space-y-7">
      <FilterGroup title="Presupuesto máximo">
        <div className="flex flex-wrap gap-1.5">
          <Chip active={!f.max} onClick={() => update({ max: null })}>
            Sin límite
          </Chip>
          {BUDGETS.map((b) => (
            <Chip key={b} active={f.max === b} onClick={() => update({ max: b })}>
              {b} €
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Marca">
        <div className="flex flex-wrap gap-1.5">
          {brands.map((b) => (
            <Chip
              key={b}
              active={f.brands.includes(b)}
              onClick={() => update({ brands: f.brands.includes(b) ? f.brands.filter((x) => x !== b) : [...f.brands, b] })}
            >
              {b}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Sistema operativo">
        <div className="flex flex-wrap gap-1.5">
          <Chip active={!f.os} onClick={() => update({ os: null })}>
            Todos
          </Chip>
          <Chip active={f.os === "android"} onClick={() => update({ os: "android" })}>
            Android
          </Chip>
          <Chip active={f.os === "ios"} onClick={() => update({ os: "ios" })}>
            iOS
          </Chip>
        </div>
      </FilterGroup>

      <FilterGroup title="Cámara">
        <Check label="Con teleobjetivo" checked={f.tele} onChange={(v) => update({ tele: v })} />
        <Check label="Ultra gran angular" checked={f.uga} onChange={(v) => update({ uga: v })} />
        <Check label="Sensor principal de 50 MP o más" checked={f.mp50} onChange={(v) => update({ mp50: v })} />
      </FilterGroup>

      <FilterGroup title="Batería">
        <div className="flex flex-wrap gap-1.5">
          <Chip active={!f.battery} onClick={() => update({ battery: null })}>
            Cualquiera
          </Chip>
          {[4500, 5000].map((b) => (
            <Chip key={b} active={f.battery === b} onClick={() => update({ battery: b })}>
              ≥ {b.toLocaleString("es-ES")} mAh
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Rendimiento" hint="Clasificación editorial del procesador según su gama, no resultados de pruebas.">
        <select
          className="field"
          value={f.tier ?? ""}
          onChange={(e) => update({ tier: (e.target.value || null) as PerformanceTier | null })}
          aria-label="Rendimiento mínimo"
        >
          <option value="">Cualquiera</option>
          {TIER_ORDER.map((t) => (
            <option key={t} value={t}>
              {TIER_LABEL[t]} o superior
            </option>
          ))}
        </select>
      </FilterGroup>

      <FilterGroup title="Pantalla">
        <div className="flex flex-wrap gap-1.5">
          <Chip active={!f.size} onClick={() => update({ size: null })}>
            Cualquier tamaño
          </Chip>
          <Chip active={f.size === "compacto"} onClick={() => update({ size: "compacto" })}>
            Compacto ≤ 6,4″
          </Chip>
          <Chip active={f.size === "grande"} onClick={() => update({ size: "grande" })}>
            Grande ≥ 6,6″
          </Chip>
        </div>
        <div className="mt-2">
          <Check label="120 Hz o más" checked={f.hz120} onChange={(v) => update({ hz120: v })} />
        </div>
      </FilterGroup>

      <FilterGroup title="Almacenamiento">
        <div className="flex flex-wrap gap-1.5">
          <Chip active={!f.storage} onClick={() => update({ storage: null })}>
            Cualquiera
          </Chip>
          {[128, 256, 512].map((s) => (
            <Chip key={s} active={f.storage === s} onClick={() => update({ storage: s })}>
              {s} GB+
            </Chip>
          ))}
        </div>
      </FilterGroup>

      {count > 0 && (
        <button type="button" onClick={reset} className="btn-ghost btn-sm -ml-3">
          Quitar todos los filtros
        </button>
      )}
    </div>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-12">
      <aside className="hidden lg:block" aria-label="Filtros">
        <div className="sticky top-[calc(var(--header-h)+24px)] max-h-[calc(100dvh-var(--header-h)-48px)] overflow-y-auto pb-6 pr-2">{panel}</div>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <p className="text-[14px] text-muted" role="status" aria-live="polite">
            <span className="font-semibold text-ink">{results.length}</span> {results.length === 1 ? "móvil" : "móviles"}
            {pending && <span className="ml-2 inline-block size-3 animate-spin rounded-full border border-line border-t-ink align-middle" />}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary btn-sm lg:hidden" onClick={() => setDrawer(true)}>
              Filtros{count ? ` (${count})` : ""}
            </button>
            <label className="sr-only" htmlFor="orden">
              Ordenar
            </label>
            <select id="orden" className="field h-8 w-auto text-[13px]" value={f.sort} onChange={(e) => update({ sort: e.target.value as Filters["sort"] })}>
              <option value="relevancia">Orden: por marca</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
              <option value="bateria">Mayor batería</option>
              <option value="reciente">Más recientes</option>
            </select>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="mt-10 rounded-sm border border-dashed border-line-strong px-6 py-14 text-center">
            <p className="text-[17px] font-medium">Ningún móvil cumple todos los filtros</p>
            <p className="mt-1 text-[14px] text-muted">Prueba a ampliar el presupuesto o a quitar algún requisito.</p>
            <button type="button" onClick={reset} className="btn-primary mt-5">
              Quitar filtros
            </button>
          </div>
        ) : (
          <ul className={`grid grid-cols-1 gap-x-6 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${pending ? "opacity-60" : ""}`}>
            {results.map((p) => (
              <li key={p.slug} className="animate-fade-up border-b border-line py-4 sm:py-6">
                <PhoneTile p={p} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Filtros en móvil */}
      <div className={`fixed inset-0 z-[60] lg:hidden ${drawer ? "visible" : "invisible"}`} role="dialog" aria-modal="true" aria-label="Filtros">
        <button
          type="button"
          aria-label="Cerrar filtros"
          className={`absolute inset-0 bg-ink/30 transition-opacity duration-300 ${drawer ? "opacity-100" : "opacity-0"}`}
          onClick={() => setDrawer(false)}
        />
        <div
          className={`absolute inset-y-0 right-0 flex w-[min(380px,90vw)] flex-col bg-paper transition-transform duration-300 ease-[var(--ease-out-soft)] ${
            drawer ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-line px-4">
            <p className="font-semibold">Filtros</p>
            <button type="button" onClick={() => setDrawer(false)} className="rounded-sm p-2 hover:bg-surface" aria-label="Cerrar">
              <CloseIcon />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{panel}</div>
          <div className="border-t border-line p-4">
            <button type="button" className="btn-primary w-full" onClick={() => setDrawer(false)}>
              Ver {results.length} {results.length === 1 ? "resultado" : "resultados"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneTile({ p }: { p: PhoneLite }) {
  const name = `${p.brand} ${p.model}`;
  return (
    <article className="group grid h-full grid-cols-[92px_1fr] gap-x-4 sm:flex sm:flex-col">
      <Link href={`/moviles/${p.slug}`} className="relative block aspect-[4/5] self-start overflow-hidden rounded-sm bg-surface sm:w-full" tabIndex={-1} aria-hidden>
        <Photo
          image={p.photo}
          alt=""
          fit="contain"
          sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 92px"
          className="img-reveal p-2 transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.03] sm:p-4"
        />
        {p.isDemo && (
          <span className="absolute left-1.5 top-1.5 hidden rounded-xs bg-paper/90 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted sm:inline">
            Ilustración
          </span>
        )}
      </Link>
      <div className="flex min-w-0 flex-col sm:flex-1">
      <Link href={`/moviles/${p.slug}`} className="block">
        <p className="kicker text-muted sm:mt-4">
          {p.brand} · {p.year}
        </p>
        <h3 className="mt-1 text-[17px] font-semibold tracking-[-0.02em] sm:mt-1.5 sm:text-[19px]">
          <span className="link-title">{name}</span>
        </h3>
      </Link>
      <ul className="mt-2 space-y-0.5 text-[12px] text-ink-2 sm:mt-3 sm:space-y-1 sm:text-[13px]">
        <li>
          {p.inches.toLocaleString("es-ES")}″ · {p.refreshHz} Hz · {p.displayType.split(" ")[0]}
        </li>
        <li>
          {p.mainMp} MP{p.ultrawide ? " + UGA" : ""}
          {p.telephoto ? ` + tele ${p.telephoto}` : ""}
        </li>
        <li>
          {p.battery.toLocaleString("es-ES")} mAh{p.charging ? ` · ${p.charging} W` : ""} · {TIER_LABEL[p.tier]}
        </li>
      </ul>
      <div className="mt-3 flex items-end justify-between gap-3 sm:mt-auto sm:pt-5">
        <div>
          {p.price !== null ? (
            <>
              <p className="text-[12px] text-muted">Desde</p>
              <p className="text-[22px] font-semibold leading-none tracking-[-0.03em]">
                {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(p.price)}
              </p>
              <p className="mt-1 text-[11px] text-muted">{p.priceIsDemo ? "Precio demo · no verificado" : p.storeName}</p>
            </>
          ) : (
            <p className="text-[13px] text-muted">Sin precio</p>
          )}
        </div>
        <CompareToggle slug={p.slug} name={name} />
      </div>
      </div>
    </article>
  );
}

function FilterGroup({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="kicker mb-3 text-ink">{title}</legend>
      {children}
      {hint && <p className="mt-2 text-[11px] leading-snug text-muted">{hint}</p>}
    </fieldset>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-8 rounded-sm border px-2.5 text-[13px] transition-colors ${
        active ? "border-ink bg-ink text-paper" : "border-line text-ink-2 hover:border-ink hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[14px]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-ink" />
      {label}
    </label>
  );
}
