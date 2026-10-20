import Image from "next/image";
import { photoCredit } from "@/lib/photos";
import type { Photo } from "@/lib/types";

/** Foto recortada a un formato fijo. */
export function PhotoImage({
  photo,
  sizes,
  priority,
  aspect = "aspect-[4/3]",
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

/** Foto de la receta con crédito. En el móvil ocupa todo el ancho. */
export function PhotoFigure({ photo, priority }: { photo: Photo; priority?: boolean }) {
  return (
    <figure className="-mx-4 sm:mx-0">
      <PhotoImage photo={photo} sizes="(min-width: 1024px) 760px, 100vw" priority={priority} className="sm:rounded-sm" />
      <figcaption className="mx-4 mt-2 text-[13px] leading-snug text-muted sm:mx-0">
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
