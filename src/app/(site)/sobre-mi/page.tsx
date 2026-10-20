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
        <p>
          <strong>{s.siteName}</strong> es mi recetario: aquí guardo y comparto las recetas que cocino, explicadas paso a paso, con sus
          ingredientes, tiempos y trucos.
        </p>
      )}
      <h2>Las recetas</h2>
      <p>
        Todas las recetas están cocinadas y escritas por mí. Las fotos son mías salvo que se indique otra autoría en el pie. Si algo no te sale o ves
        un error, <Link href="/contacto">escríbeme</Link>.
      </p>
      <h2>Contacto</h2>
      <p>
        <ContactEmail s={s} />
      </p>
    </InfoPage>
  );
}
