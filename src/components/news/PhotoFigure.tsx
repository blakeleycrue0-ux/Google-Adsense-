import Image from "next/image";
import { photoCredit } from "@/lib/photos";
import type { Photo } from "@/lib/types";

/** Foto recortada a un formato fijo. Quien la usa decide qué hacer si no hay foto. */
export function PhotoImage({
  photo,
  sizes,
  priority,
  aspect = "aspect-[3/2]",
  className = "",
}: {
  photo: Photo;
  sizes: string;
  priority?: boolean;
  aspect?: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-surface ${aspect} ${className}`}>
      <Image src={photo.url} alt={photo.alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}

/** Foto de la noticia con pie y crédito. En el móvil ocupa todo el ancho. */
export function PhotoFigure({ photo, priority }: { photo: Photo; priority?: boolean }) {
  return (
    <figure className="-mx-4 sm:mx-0">
      <PhotoImage photo={photo} sizes="(min-width: 1024px) 760px, 100vw" priority={priority} className="sm:rounded-sm" />
      <figcaption className="mx-4 mt-2 border-b border-line pb-3 text-[13px] leading-snug text-muted sm:mx-0">
        {photo.alt && <span className="text-ink-2">{photo.alt}. </span>}
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
