import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, InfoPage, OwnerField, getSettings } from "@/components/site/InfoPage";

export const revalidate = 300;
export const metadata: Metadata = { title: "Política de privacidad", alternates: { canonical: "/privacidad" } };

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <InfoPage title="Política de privacidad">
      <h2>Responsable del tratamiento</h2>
      <p>
        <OwnerField value={s.ownerName} /> (NIF <OwnerField value={s.ownerNif} />). Contacto: <ContactEmail s={s} />.
      </p>
      <h2>Qué datos tratamos</h2>
      <ul>
        <li>
          <strong>Si nos escribes por correo:</strong> tu dirección y lo que nos cuentes, solo para responderte. Se conservan el tiempo necesario para
          atender tu consulta.
        </li>
        <li>
          <strong>Al navegar:</strong> esta web no tiene registro de usuarios ni formularios que guarden datos personales. Los datos técnicos de
          navegación y las cookies los tratan los servicios de terceros que se explican a continuación.
        </li>
      </ul>
      <h2>Publicidad de Google (AdSense)</h2>
      <p>
        Esta web muestra anuncios de Google AdSense. Google, como proveedor externo, utiliza cookies para publicar anuncios basados en las visitas
        anteriores del usuario a este y otros sitios web. El uso de cookies de publicidad permite a Google y a sus socios mostrar anuncios basados en
        tus visitas a este sitio o a otros sitios de Internet.
      </p>
      <p>
        Puedes inhabilitar la publicidad personalizada en la{" "}
        <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
          configuración de anuncios de Google
        </a>{" "}
        o, para otros proveedores, en{" "}
        <a href="https://www.aboutads.info/choices" target="_blank" rel="noopener noreferrer">
          aboutads.info
        </a>
        . Más información sobre cómo usa Google los datos:{" "}
        <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
          policies.google.com/technologies/partner-sites
        </a>
        .
      </p>
      <p>
        Antes de cargar cookies no necesarias se te pide el consentimiento mediante el mensaje de privacidad de Google (plataforma de gestión de
        consentimiento certificada por IAB). Puedes cambiar tu decisión en cualquier momento desde el enlace de privacidad que muestra ese mensaje.
      </p>
      <h2>Base legal y derechos</h2>
      <p>
        La base legal es tu consentimiento (cookies y publicidad personalizada) y el interés legítimo en responder a tus consultas. Puedes ejercer
        tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a <ContactEmail s={s} />. Si consideras
        que no hemos atendido tu solicitud, puedes reclamar ante la{" "}
        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
          Agencia Española de Protección de Datos
        </a>
        .
      </p>
      <p>
        Más detalles en la <Link href="/cookies">política de cookies</Link>.
      </p>
    </InfoPage>
  );
}
