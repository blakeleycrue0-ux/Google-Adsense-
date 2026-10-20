import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, InfoPage, OwnerField, getSettings } from "@/components/site/InfoPage";

export const revalidate = 300;
export const metadata: Metadata = { title: "Aviso legal", alternates: { canonical: "/aviso-legal" } };

export default async function LegalNoticePage() {
  const s = await getSettings();
  return (
    <InfoPage title="Aviso legal">
      <p>
        En cumplimiento de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), se informa de los datos
        del titular de este sitio web:
      </p>
      <ul>
        <li>
          <strong>Titular:</strong> <OwnerField value={s.ownerName} />
        </li>
        <li>
          <strong>NIF:</strong> <OwnerField value={s.ownerNif} />
        </li>
        <li>
          <strong>Domicilio:</strong> <OwnerField value={s.ownerAddress} />
        </li>
        <li>
          <strong>Correo electrónico:</strong> <ContactEmail s={s} />
        </li>
        <li>
          <strong>Nombre del sitio:</strong> {s.siteName}
        </li>
      </ul>
      <h2>Objeto</h2>
      <p>
        {s.siteName} es un medio digital de información local sobre las Islas Baleares. El acceso es gratuito y se financia con publicidad.
      </p>
      <h2>Propiedad intelectual</h2>
      <p>
        Los textos publicados son propiedad del titular, salvo que se indique otra autoría. Se permite citarlos con enlace a la noticia original. Las
        fotografías indican en cada caso su autor y licencia; las de terceros se usan conforme a su licencia o con permiso de quien las difunde.
      </p>
      <p>
        Si eres titular de algún contenido y crees que se ha usado de forma indebida, escríbenos a <ContactEmail s={s} /> y lo revisaremos de
        inmediato.
      </p>
      <h2>Responsabilidad</h2>
      <p>
        Trabajamos para que la información sea veraz y esté actualizada, y corregimos los errores en cuanto los detectamos (ver{" "}
        <Link href="/normas-editoriales">normas editoriales</Link>). No nos hacemos responsables del contenido de las webs externas enlazadas.
      </p>
      <h2>Legislación aplicable</h2>
      <p>Este aviso se rige por la legislación española.</p>
    </InfoPage>
  );
}
