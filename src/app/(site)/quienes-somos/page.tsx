import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, InfoPage, getSettings } from "@/components/site/InfoPage";

export const revalidate = 300;
export const metadata: Metadata = { title: "Quiénes somos", alternates: { canonical: "/quienes-somos" } };

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <InfoPage title="Quiénes somos">
      <p>
        <strong>{s.siteName}</strong> es un diario digital independiente con noticias de Mallorca, Menorca, Ibiza y Formentera: lo que pasa en la
        calle, en las carreteras, en el aeropuerto, en los ayuntamientos y en el Govern, contado de forma clara y rápida.
      </p>
      <h2>Qué publicamos</h2>
      <ul>
        <li>Sucesos y emergencias, con información de fuentes oficiales.</li>
        <li>Tráfico, transporte y cortes de servicios.</li>
        <li>Avisos meteorológicos y el tiempo en las islas.</li>
        <li>Política local y autonómica, economía y turismo.</li>
        <li>Cultura, fiestas, agenda y deportes.</li>
      </ul>
      <h2>Cómo trabajamos</h2>
      <p>
        Contrastamos la información con fuentes oficiales (Govern, ayuntamientos, Policía, Guardia Civil, 112, AEMET…) y la citamos en cada
        noticia. Las fotos son propias o de fuentes que permiten su uso, y siempre indicamos su autoría. Puedes leer nuestras{" "}
        <Link href="/normas-editoriales">normas editoriales</Link>.
      </p>
      <h2>Contacto</h2>
      <p>
        ¿Tienes una noticia, una foto o una corrección? Escríbenos a <ContactEmail s={s} />.
      </p>
    </InfoPage>
  );
}
