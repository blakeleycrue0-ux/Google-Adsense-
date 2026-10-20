import type { Metadata } from "next";
import { ContactEmail, InfoPage, getSettings } from "@/components/site/InfoPage";

export const revalidate = 300;
export const metadata: Metadata = { title: "Contacto", alternates: { canonical: "/contacto" } };

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <InfoPage title="Contacto">
      <p>
        Escríbenos a <ContactEmail s={s} /> para:
      </p>
      <ul>
        <li>Enviarnos una noticia o una foto de algo que esté pasando en tu zona (indica si podemos citarte como autor).</li>
        <li>Avisarnos de un error en una noticia.</li>
        <li>Notas de prensa de ayuntamientos, asociaciones, clubes y empresas.</li>
        <li>Publicidad y colaboraciones.</li>
      </ul>
      <p>Respondemos lo antes posible.</p>
    </InfoPage>
  );
}
