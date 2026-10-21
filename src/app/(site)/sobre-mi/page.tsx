import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, InfoPage, getSettings } from "@/components/site/InfoPage";
import { renderMarkdown } from "@/lib/markdown";

export const revalidate = 300;
export const metadata: Metadata = { title: "Sobre mí", alternates: { canonical: "/sobre-mi" } };

/** El texto se escribe en el panel (Ajustes → Sobre mí). Sin texto, se muestra uno general. */
export default async function AboutPage() {
  const s = await getSettings();
  return (
    <InfoPage title="Sobre mí">
      {s.about.trim() ? (
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(s.about) }} />
      ) : (
        <>
          <p>
            Hola. Esta es mi libreta de cocina. Aquí apunto las recetas que me gusta cocinar y las que más me piden: platos de siempre, guisos de
            cuchara, arroces, postres y también las bases que hacen que todo salga mejor, como un buen fondo, un sofrito sin prisas o una salsa
            bien ligada.
          </p>
          <p>
            Me gusta cocinar y me gusta compartirlo. Muchas veces alguien prueba algo que he hecho y me pregunta: «¿me pasas la receta?». Esta web es
            la respuesta: todas las recetas en un mismo sitio, explicadas paso a paso, con cantidades claras, tiempos y los trucos que marcan la
            diferencia.
          </p>
          <h2>Cómo son las recetas</h2>
          <ul>
            <li>Recetas caseras y tradicionales, con ingredientes que se encuentran en cualquier supermercado.</li>
            <li>Cantidades exactas y pasos ordenados, para que salgan bien a la primera.</li>
            <li>Consejos de técnica, variantes y cómo conservar cada plato.</li>
          </ul>
          <p>
            Si haces alguna receta, si algo no te sale o si ves un error, <Link href="/contacto">escríbeme</Link>: me ayuda a mejorar cada receta.
          </p>
        </>
      )}
      <h2>Contacto</h2>
      <p>
        <ContactEmail s={s} />
      </p>
    </InfoPage>
  );
}
