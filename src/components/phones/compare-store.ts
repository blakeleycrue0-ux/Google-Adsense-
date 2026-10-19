"use client";

import { useSyncExternalStore } from "react";

const KEY = "voltio-compare";
const EVENT = "voltio:compare-change";
export const MAX_COMPARE = 4;

export interface CompareItem {
  slug: string;
  name: string;
}

let cache: { raw: string | null; items: CompareItem[] } = { raw: null, items: [] };

function read(): CompareItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cache.raw) cache = { raw, items: raw ? (JSON.parse(raw) as CompareItem[]) : [] };
  } catch {
    cache = { raw: null, items: [] };
  }
  return cache.items;
}

function write(items: CompareItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const EMPTY: CompareItem[] = [];

export function useCompare() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    items,
    has: (slug: string) => items.some((i) => i.slug === slug),
    toggle: (item: CompareItem) => {
      const cur = read();
      if (cur.some((i) => i.slug === item.slug)) write(cur.filter((i) => i.slug !== item.slug));
      else if (cur.length < MAX_COMPARE) write([...cur, item]);
    },
    remove: (slug: string) => write(read().filter((i) => i.slug !== slug)),
    clear: () => write([]),
    full: items.length >= MAX_COMPARE,
  };
}
