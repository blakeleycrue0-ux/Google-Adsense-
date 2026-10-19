"use client";

import { useRef, useState } from "react";
import { uploadInline } from "@/app/admin/(panel)/medios/actions";

/** Campo de URL de imagen con subida directa y selección de la biblioteca. */
export function ImageInput({
  name,
  defaultValue,
  library,
  altFieldName,
}: {
  name: string;
  defaultValue?: string;
  library: { url: string; alt: string }[];
  altFieldName?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showLib, setShowLib] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File) => {
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.set("file", file);
    const altInput = altFieldName ? (document.querySelector(`[name="${altFieldName}"]`) as HTMLInputElement | null) : null;
    fd.set("alt", altInput?.value ?? "");
    const res = await uploadInline(fd);
    setBusy(false);
    if (res.ok) setUrl(res.url);
    else setError(res.error);
  };

  return (
    <div>
      <div className="flex gap-3">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-sm border border-line bg-surface">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-[11px] text-faint">Sin imagen</span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input name={name} value={url} onChange={(e) => setUrl(e.target.value)} className="field" placeholder="/uploads/… o https://…" />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? "Subiendo…" : "Subir imagen"}
            </button>
            {library.length > 0 && (
              <button type="button" className="btn-ghost btn-sm" onClick={() => setShowLib((v) => !v)}>
                {showLib ? "Ocultar biblioteca" : "Elegir de la biblioteca"}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
          {error && <p className="text-[12px] text-live">{error}</p>}
        </div>
      </div>
      {showLib && (
        <div className="mt-3 grid max-h-64 grid-cols-4 gap-2 overflow-y-auto rounded-sm border border-line p-2 sm:grid-cols-6">
          {library.map((m) => (
            <button
              type="button"
              key={m.url}
              onClick={() => {
                setUrl(m.url);
                setShowLib(false);
              }}
              className={`relative aspect-[4/3] overflow-hidden rounded-xs border ${m.url === url ? "border-ink" : "border-line"}`}
              title={m.alt}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.alt} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
