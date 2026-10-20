import type { Metadata } from "next";
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
        {s.siteName} es una web personal de recetas de cocina. El acceso es gratuito y se financia con publicidad.
      </p>
      <h2>Propiedad intelectual</h2>
      <p>
        Los textos publicados son propiedad del titular, salvo que se indique otra autoría. Se permite citarlos con enlace a la receta original. Las
        fotografías indican en cada caso su autor y licencia; las de terceros se usan conforme a su licencia o con permiso de quien las difunde.
      </p>
      <p>
        Si eres titular de algún contenido y crees que se ha usado de forma indebida, escríbenos a <ContactEmail s={s} /> y lo revisaremos de
        inmediato.
      </p>
      <h2>Responsabilidad</h2>
      <p>
        Las recetas se publican con la mayor atención posible, pero cada persona debe tener en cuenta sus alergias, intolerancias y las normas
        básicas de higiene y seguridad en la cocina. No me hago responsable del contenido de las webs externas enlazadas.
      </p>
      <h2>Legislación aplicable</h2>
      <p>Este aviso se rige por la legislación española.</p>
    </InfoPage>
  );
}
