import type { Metadata } from "next";
import { InfoPage } from "@/components/site/InfoPage";

export const metadata: Metadata = { title: "Política de cookies", alternates: { canonical: "/cookies" } };

export default function CookiesPage() {
  return (
    <InfoPage title="Política de cookies">
      <p>
        Las cookies son pequeños archivos que una web guarda en tu navegador. Esta web no usa cookies propias para seguirte. Las de publicidad
        son de terceros, se describen aquí y solo se instalan después de que des tu consentimiento en el mensaje de privacidad. Mientras la
        publicidad no esté activa, a los visitantes no se les instala ninguna cookie.
      </p>
      <h2>Cookies que se usan</h2>
      <table>
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>Finalidad</th>
            <th>Tipo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Google AdSense</td>
            <td>Mostrar anuncios, limitar las veces que ves el mismo anuncio, medir su rendimiento y, si lo aceptas, personalizarlos.</td>
            <td>Publicidad (terceros)</td>
          </tr>
          <tr>
            <td>Google (mensaje de privacidad)</td>
            <td>Recordar tus preferencias de consentimiento.</td>
            <td>Técnica (terceros)</td>
          </tr>
        </tbody>
      </table>
      <p>
        La lista completa de cookies de Google y su duración está en{" "}
        <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer">
          policies.google.com/technologies/cookies
        </a>
        .
      </p>
      <h2>Cómo cambiar o retirar el consentimiento</h2>
      <p>
        Puedes cambiar tu elección desde el enlace del mensaje de privacidad de Google que aparece en la web, o borrar las cookies desde la
        configuración de tu navegador. Si las rechazas, seguirás viendo anuncios, pero no personalizados.
      </p>
    </InfoPage>
  );
}
