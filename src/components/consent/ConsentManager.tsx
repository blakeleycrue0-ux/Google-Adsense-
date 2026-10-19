"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { OPEN_EVENT, consentSnapshot, readConsent, subscribeConsent, writeConsent } from "./consent-store";

/**
 * Banner propio de consentimiento + carga condicionada de Google Analytics.
 * Se usa en modo «builtin». En modo «external» la CMP certificada se encarga
 * del consentimiento y este componente solo carga Analytics.
 */
export function ConsentManager({ gaId, mode, adsEnabled }: { gaId: string; mode: "builtin" | "external"; adsEnabled: boolean }) {
  // undefined = aún sin hidratar; null = sin decisión guardada.
  const consent = useSyncExternalStore(subscribeConsent, consentSnapshot, () => undefined);
  const ready = consent !== undefined;
  const [dismissed, setDismissed] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [draft, setDraft] = useState({ analytics: false, ads: false });
  const showBanner = mode === "builtin" && consent === null && !dismissed;

  useEffect(() => {
    const onOpen = () => {
      const cur = readConsent();
      setDraft({ analytics: cur?.analytics ?? false, ads: cur?.ads ?? false });
      setShowPrefs(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  // Google Analytics: en modo builtin solo se carga tras aceptar la analítica.
  const loadGa = Boolean(gaId) && ready && (mode === "external" || consent?.analytics);
  useEffect(() => {
    if (!loadGa || document.getElementById("ga-src")) return;
    const s = document.createElement("script");
    s.id = "ga-src";
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(s);
    window.gtag?.("js", new Date());
    window.gtag?.("config", gaId, { anonymize_ip: true });
  }, [loadGa, gaId]);

  const decide = (analytics: boolean, ads: boolean) => {
    writeConsent(analytics, ads);
    setDismissed(true);
    setShowPrefs(false);
  };

  if (mode !== "builtin") return null;

  return (
    <>
      {showBanner && !showPrefs && (
        <div
          role="region"
          aria-label="Consentimiento de cookies"
          className="fixed inset-x-0 bottom-0 z-50 animate-fade-up p-3 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-[420px] sm:p-0"
        >
          <div className="rounded-md border border-line bg-paper p-5 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.35)]">
            <p className="text-[15px] font-semibold tracking-[-0.01em]">Tu privacidad, tus reglas 🍪</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Usamos cookies técnicas necesarias. Con tu permiso, también usaremos cookies de analítica
              {adsEnabled ? " y de publicidad" : ""} para medir la audiencia y financiar el medio. Puedes cambiar tu elección
              cuando quieras. <Link href="/legal/cookies" className="text-ink underline underline-offset-2">Más información</Link>.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => decide(false, false)} className="btn-secondary">
                Rechazar
              </button>
              <button type="button" onClick={() => decide(true, adsEnabled)} className="btn-primary">
                Aceptar
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setDraft({ analytics: false, ads: false });
                setShowPrefs(true);
              }}
              className="mt-3 w-full text-center text-[13px] text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Configurar
            </button>
          </div>
        </div>
      )}

      {showPrefs && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="consent-title">
          <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-ink/30" onClick={() => setShowPrefs(false)} />
          <div className="relative w-full max-w-lg animate-fade-up rounded-t-md bg-paper p-6 sm:rounded-md">
            <h2 id="consent-title" className="text-[18px] font-semibold tracking-[-0.015em]">
              Preferencias de privacidad
            </h2>
            <ul className="mt-5 divide-y divide-line border-y border-line">
              <PrefRow title="Necesarias" description="Recordar tu elección y mantener la sesión del panel. Siempre activas." checked disabled />
              <PrefRow
                title="Analítica"
                description="Google Analytics para saber qué contenidos son útiles."
                checked={draft.analytics}
                onChange={(v) => setDraft((d) => ({ ...d, analytics: v }))}
              />
              <PrefRow
                title="Publicidad"
                description="Google AdSense: mostrar y medir anuncios, incluidos anuncios personalizados."
                checked={draft.ads}
                onChange={(v) => setDraft((d) => ({ ...d, ads: v }))}
              />
            </ul>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button type="button" onClick={() => decide(false, false)} className="btn-secondary">
                Rechazar todo
              </button>
              <button type="button" onClick={() => decide(draft.analytics, draft.ads)} className="btn-secondary">
                Guardar
              </button>
              <button type="button" onClick={() => decide(true, true)} className="btn-primary col-span-2 sm:col-span-1">
                Aceptar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PrefRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <li className="flex items-start justify-between gap-6 py-4">
      <div>
        <p className="text-[14px] font-medium">{title}</p>
        <p className="mt-0.5 text-[13px] text-muted">{description}</p>
      </div>
      <label className="relative mt-0.5 inline-flex shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          aria-label={title}
        />
        <span className="h-6 w-10 rounded-full bg-surface-2 transition-colors peer-checked:bg-ink peer-disabled:opacity-50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-paper shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
      </label>
    </li>
  );
}
