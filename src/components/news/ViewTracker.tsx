"use client";

import { useEffect } from "react";

/** Registra una visita real por sesión y artículo (sin cookies ni datos personales). */
export function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    if (navigator.webdriver) return;
    const key = `voltio-viewed:${postId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    const t = setTimeout(() => {
      const body = JSON.stringify({ postId });
      if (!navigator.sendBeacon?.("/api/views", new Blob([body], { type: "application/json" }))) {
        fetch("/api/views", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [postId]);
  return null;
}
