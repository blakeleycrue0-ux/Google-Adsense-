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
  imgClassName = "",
}: {
  photo: Photo;
  sizes: string;
  priority?: boolean;
  aspect?: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-surface ${aspect} ${className}`}>
      <Image src={photo.url} alt={photo.alt} fill sizes={sizes} priority={priority} className={`object-cover ${imgClassName}`} />
    </div>
  );
}

/** Foto de la receta con crédito. */
export function PhotoFigure({ photo, priority }: { photo: Photo; priority?: boolean }) {
  return (
    <figure>
      <PhotoImage photo={photo} sizes="(min-width: 1180px) 1130px, 100vw" priority={priority} aspect="aspect-[4/3] sm:aspect-[16/9]" className="rounded-3xl" />
      <figcaption className="mt-2 text-right text-xs leading-snug text-muted">
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
