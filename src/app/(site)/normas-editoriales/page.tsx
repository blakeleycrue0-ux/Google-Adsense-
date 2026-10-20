import type { Metadata } from "next";
import { ContactEmail, InfoPage, getSettings } from "@/components/site/InfoPage";

export const revalidate = 300;
export const metadata: Metadata = { title: "Normas editoriales", alternates: { canonical: "/normas-editoriales" } };

export default async function EditorialPage() {
  const s = await getSettings();
  return (
    <InfoPage title="Normas editoriales">
      <h2>Veracidad y fuentes</h2>
      <p>
        Solo publicamos información que podemos atribuir a una fuente identificable. Cuando un dato no está confirmado, lo decimos. Enlazamos las
        fuentes oficiales al final de cada noticia.
      </p>
      <h2>Uso de herramientas de inteligencia artificial</h2>
      <p>
        Podemos usar herramientas de IA para ayudar a ordenar y redactar el material de partida. Ninguna noticia se publica sin que una persona la
        revise, compruebe los datos y la apruebe. No usamos IA para generar fotografías de hechos reales.
      </p>
      <h2>Fotografías</h2>
      <p>
        Las fotos son propias, de gabinetes de prensa oficiales o de bancos de imágenes con licencia libre. Cada foto indica su autoría. Cuando una
        foto es de archivo o ilustrativa, se indica en el pie.
      </p>
      <h2>Sucesos y menores</h2>
      <p>
        No identificamos a víctimas ni a menores, respetamos la presunción de inocencia y evitamos detalles morbosos que no aportan información.
      </p>
      <h2>Correcciones</h2>
      <p>
        Si detectamos un error, lo corregimos lo antes posible y, si es relevante, lo indicamos en la noticia. Puedes avisarnos en <ContactEmail s={s} />.
      </p>
      <h2>Independencia</h2>
      <p>La publicidad la gestiona Google de forma automática y no influye en las noticias. No publicamos contenidos patrocinados sin señalarlos.</p>
    </InfoPage>
  );
}
