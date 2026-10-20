import Image from "next/image";
import { photoCredit } from "@/lib/photos";
import type { Photo } from "@/lib/types";

/** Foto con su crédito. Sin foto, un bloque neutro (nunca una imagen inventada). */
export function PhotoImage({ photo, sizes, priority, className = "" }: { photo: Photo | null; sizes: string; priority?: boolean; className?: string }) {
  return (
    <div className={`relative aspect-[3/2] overflow-hidden bg-surface ${className}`}>
      {photo ? (
        <Image src={photo.url} alt={photo.alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-sea/10 to-sea/25">
          <svg viewBox="0 0 64 24" className="w-1/4 text-sea/40" aria-hidden>
            <path d="M2 16c6-5 12-5 18 0s12 5 18 0 12-5 18 0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

export function PhotoFigure({ photo, priority }: { photo: Photo; priority?: boolean }) {
  return (
    <figure>
      <PhotoImage photo={photo} sizes="(min-width: 1024px) 760px, 100vw" priority={priority} className="rounded-md" />
      <figcaption className="mt-2 flex flex-wrap gap-x-2 text-sm text-muted">
        {photo.alt && <span>{photo.alt}.</span>}
        {photo.sourceUrl ? (
          <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2">
            {photoCredit(photo)}
          </a>
        ) : (
          <span>{photoCredit(photo)}</span>
        )}
      </figcaption>
    </figure>
  );
}
