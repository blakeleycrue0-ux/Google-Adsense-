import type { ImageRef } from "@/lib/types";

const VIA: Record<string, string> = {
  wikimedia: "Wikimedia Commons",
  openverse: "Openverse",
  pexels: "Pexels",
  unsplash: "Unsplash",
  press: "Imagen de prensa",
  feed: "Imagen de la fuente",
  retailer: "Imagen de la tienda",
};

const link = "underline decoration-line-strong underline-offset-2 hover:text-ink hover:decoration-ink";

/** Atribución visible de una imagen: autor, procedencia y licencia (con enlaces). */
export function ImageCredit({ image, className = "" }: { image: ImageRef; className?: string }) {
  const m = image.meta;
  if (!m) {
    if (image.illustrative) return <span className={className}>Ilustración de demostración</span>;
    return image.credit ? <span className={className}>{image.credit}</span> : null;
  }
  if (m.provider === "upload" && m.license === "own") return image.credit ? <span className={className}>{image.credit}</span> : null;
  const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
  return (
    <span className={className}>
      {m.author && (
        <>
          Foto:{" "}
          {m.authorUrl ? (
            <a href={m.authorUrl} {...ext} className={link}>
              {m.author}
            </a>
          ) : (
            m.author
          )}
        </>
      )}
      {VIA[m.provider] && (
        <>
          {m.author ? " · " : ""}
          {m.sourceUrl ? (
            <a href={m.sourceUrl} {...ext} className={link}>
              {VIA[m.provider]}
            </a>
          ) : (
            VIA[m.provider]
          )}
        </>
      )}
      {(m.license.startsWith("cc") || m.license === "pdm" || m.provider === "pexels" || m.provider === "unsplash") && (
        <>
          {" · "}
          {m.licenseUrl ? (
            <a href={m.licenseUrl} {...ext} rel="license noopener noreferrer" className={link}>
              {m.licenseName}
            </a>
          ) : (
            m.licenseName
          )}
        </>
      )}
    </span>
  );
}
