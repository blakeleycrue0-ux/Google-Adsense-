import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, InfoPage, OwnerField, getSettings } from "@/components/site/InfoPage";

export const revalidate = 300;
export const metadata: Metadata = { title: "Política de privacidad", alternates: { canonical: "/privacidad" } };

/**
 * Política conforme al RGPD (art. 13) y a la LOPDGDD. Refleja lo que hace la
 * web de verdad: sin registro de usuarios ni formularios; correo, alojamiento
 * en Netlify y, si se activa, publicidad de Google.
 */
export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <InfoPage title="Política de privacidad" updated="21 de octubre de 2026">
      <h2>Responsable del tratamiento</h2>
      <ul>
        <li>
          <strong>Titular:</strong> <OwnerField value={s.ownerName} />
        </li>
        <li>
          <strong>NIF/NIE:</strong> <OwnerField value={s.ownerNif} />
        </li>
        <li>
          <strong>Domicilio:</strong> <OwnerField value={s.ownerAddress} />
        </li>
        <li>
          <strong>Contacto:</strong> <ContactEmail s={s} />
        </li>
      </ul>

      <h2>Qué datos se tratan, para qué y durante cuánto tiempo</h2>
      <ul>
        <li>
          <strong>Si me escribes por correo:</strong> tu dirección de correo y lo que me cuentes, solo para responderte. Base legal: tu consentimiento
          al escribirme. Se conservan el tiempo necesario para atender tu consulta y, como máximo, un año.
        </li>
        <li>
          <strong>Al visitar la web:</strong> no hay registro de usuarios, comentarios ni formularios que guarden datos personales. El servidor que
          aloja la web registra datos técnicos de cada visita (dirección IP, navegador, página visitada y hora) para funcionar y protegerse de abusos.
          Base legal: interés legítimo en la seguridad del servicio. Esos registros se borran automáticamente en pocos días.
        </li>
        <li>
          <strong>Publicidad:</strong> si aceptas las cookies de publicidad, Google trata los datos que se explican más abajo.
        </li>
      </ul>
      <p>No se toman decisiones automatizadas ni se elaboran perfiles con tus datos por parte del titular, y no se venden ni ceden a nadie.</p>

      <h2>Proveedores que tratan datos</h2>
      <ul>
        <li>
          <strong>Netlify, Inc.</strong> (Estados Unidos): alojamiento de la web. Actúa como encargado del tratamiento. La transferencia
          internacional se ampara en el Marco de Privacidad de Datos UE-EE. UU. y en las cláusulas contractuales tipo de la Comisión Europea.
        </li>
        <li>
          <strong>Google Ireland Ltd.</strong>: publicidad (AdSense) y mensaje de consentimiento de cookies, cuando estén activos.
        </li>
      </ul>

      <h2>Publicidad de Google (AdSense)</h2>
      <p>
        Esta web puede mostrar anuncios de Google AdSense. Google, como proveedor externo, utiliza cookies para publicar anuncios basados en las
        visitas anteriores del usuario a este y otros sitios web. El uso de cookies de publicidad permite a Google y a sus socios mostrar anuncios
        basados en tus visitas a este sitio o a otros sitios de Internet.
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
        Más detalles en la <Link href="/cookies">política de cookies</Link>.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, y retirar tu
        consentimiento en cualquier momento, escribiendo a <ContactEmail s={s} />. Si consideras que no he atendido tu solicitud, puedes reclamar ante
        la{" "}
        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
          Agencia Española de Protección de Datos
        </a>
        .
      </p>

      <h2>Menores</h2>
      <p>Esta web no está dirigida a menores de 14 años ni recoge conscientemente sus datos.</p>
    </InfoPage>
  );
}
