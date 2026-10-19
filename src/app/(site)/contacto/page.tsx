import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { getSettings } from "@/lib/settings";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos para enviar información, correcciones o propuestas.",
  alternates: { canonical: "/contacto" },
};

export default async function ContactPage({ searchParams }: PageProps<"/contacto">) {
  const s = await getSettings();
  const asunto = (await searchParams).asunto;
  return (
    <>
      <PageHeader kicker="Hablemos" title="Contacto" description="¿Tienes una pista, has detectado un error o quieres proponer una colaboración? Escríbenos." />
      <div className="container-x mt-12 grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ContactForm defaultSubject={typeof asunto === "string" ? asunto.slice(0, 140) : undefined} />
        </div>
        <aside className="space-y-8 text-[14px] leading-relaxed text-muted lg:col-span-4 lg:col-start-9">
          <div>
            <p className="kicker border-t-2 border-ink pt-4 text-ink">Correcciones</p>
            <p className="mt-3">Si detectas un error en una noticia, indícanos el enlace y la corrección. Revisamos todas las notificaciones.</p>
          </div>
          <div>
            <p className="kicker border-t-2 border-ink pt-4 text-ink">Publicidad</p>
            <p className="mt-3">
              Para propuestas comerciales, indícalo en el asunto. El contenido patrocinado siempre se identifica como tal.
            </p>
          </div>
          {s.contactEmail && (
            <div>
              <p className="kicker border-t-2 border-ink pt-4 text-ink">Correo</p>
              <p className="mt-3">
                <a href={`mailto:${s.contactEmail}`} className="text-ink underline underline-offset-2">
                  {s.contactEmail}
                </a>
              </p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
