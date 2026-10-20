import { getSettings } from "@/lib/settings";
import type { Settings } from "@/lib/types";

/** Página informativa (legal, quiénes somos…) con el mismo formato de texto que las noticias. */
export function InfoPage({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-[760px]">
      <h1 className="headline border-b-2 border-ink pb-4 text-3xl sm:text-4xl">{title}</h1>
      <div className="prose-news mt-8">{children}</div>
      {updated && <p className="mt-10 text-sm text-muted">Última actualización: {updated}</p>}
    </article>
  );
}

/** Dato del titular de la web; si falta, se avisa en lugar de inventarlo. */
export function OwnerField({ value }: { value: string }) {
  return value ? <>{value}</> : <mark className="rounded bg-[#fff3cd] px-1 text-warn">pendiente de completar en el panel</mark>;
}

export function ContactEmail({ s }: { s: Settings }) {
  return s.contactEmail ? <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a> : <OwnerField value="" />;
}

export { getSettings };
