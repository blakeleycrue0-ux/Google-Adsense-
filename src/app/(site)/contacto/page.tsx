import type { Metadata } from "next";
import { ContactEmail, InfoPage, getSettings } from "@/components/site/InfoPage";

export const revalidate = 300;
export const metadata: Metadata = { title: "Contacto", alternates: { canonical: "/contacto" } };

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <InfoPage title="Contacto">
      <p>
        Escríbeme a <ContactEmail s={s} /> para:
      </p>
      <ul>
        <li>Preguntarme dudas sobre una receta o contarme cómo te ha salido.</li>
        <li>Avisarme de un error en una receta.</li>
        <li>Proponerme una receta que te gustaría ver aquí.</li>
        <li>Colaboraciones.</li>
      </ul>
      <p>Respondo lo antes posible.</p>
    </InfoPage>
  );
}
