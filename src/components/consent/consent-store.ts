"use client";

import { CONSENT_KEY_SERVER } from "./constants";

export const CONSENT_KEY = CONSENT_KEY_SERVER;
export const CONSENT_VERSION = 1;
export const OPEN_EVENT = "voltio:consent-open";
export const CHANGE_EVENT = "voltio:consent-change";

export interface ConsentState {
  analytics: boolean;
  ads: boolean;
  v: number;
  ts: string;
}

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    googlefc?: { callbackQueue: unknown[]; showRevocationMessage?: () => void };
    adsbygoogle?: unknown[];
  }
}

let snap: { raw: string | null; value: ConsentState | null } = { raw: null, value: null };

/** Instantánea estable para useSyncExternalStore. */
export function consentSnapshot(): ConsentState | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(CONSENT_KEY);
  } catch {}
  if (raw !== snap.raw) snap = { raw, value: readConsent() };
  return snap.value;
}

export function subscribeConsent(cb: () => void) {
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function readConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as ConsentState;
    return c.v === CONSENT_VERSION ? c : null;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function gtag(..._args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  // gtag espera el objeto `arguments`, no un array.
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

export function writeConsent(analytics: boolean, ads: boolean) {
  const state: ConsentState = { analytics, ads, v: CONSENT_VERSION, ts: new Date().toISOString() };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  } catch {}
  gtag("consent", "update", {
    analytics_storage: analytics ? "granted" : "denied",
    ad_storage: ads ? "granted" : "denied",
    ad_user_data: ads ? "granted" : "denied",
    ad_personalization: ads ? "granted" : "denied",
  });
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: state }));
  return state;
}

export function openConsentPreferences() {
  if (window.googlefc) {
    window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
    window.googlefc.callbackQueue.push(() => window.googlefc?.showRevocationMessage?.());
    return;
  }
  window.dispatchEvent(new Event(OPEN_EVENT));
}
