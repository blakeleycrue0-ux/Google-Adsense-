import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { AdminPage, Field, Panel } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveSettings } from "./actions";

export default async function SettingsPage() {
  await requireUser("admin");
  const s = await getSettings();
  return (
    <AdminPage title="Ajustes" description="Configuración general del medio. Los cambios se aplican a toda la web.">
      <ActionForm action={saveSettings} className="space-y-6">
        <Panel title="General">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre del medio"><input name="siteName" defaultValue={s.siteName} className="field" /></Field>
            <Field label="Lema"><input name="tagline" defaultValue={s.tagline} className="field" /></Field>
            <Field label="URL pública" hint="Se usa en canonical, sitemap, Open Graph y datos estructurados."><input name="siteUrl" defaultValue={s.siteUrl} className="field" /></Field>
            <Field label="Correo de contacto"><input name="contactEmail" defaultValue={s.contactEmail} className="field" /></Field>
          </div>
          <label className="mt-5 flex items-start gap-2.5 border-t border-line pt-4 text-[13px]">
            <input type="checkbox" name="demoMode" defaultChecked={s.demoMode} className="mt-0.5 size-4 accent-ink" />
            <span>
              <strong className="font-medium">Modo demostración.</strong> Muestra el aviso de contenido de demostración y bloquea la indexación (noindex y robots.txt). Desactívalo cuando el contenido real esté listo.
            </span>
          </label>
        </Panel>

        <Panel title="Google" description="Analytics se carga solo con consentimiento (Consent Mode v2).">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ID de medición de Google Analytics 4"><input name="gaMeasurementId" defaultValue={s.analytics.gaMeasurementId} className="field font-mono" placeholder="G-XXXXXXXXXX" /></Field>
            <Field label="Verificación de Search Console" hint="Solo el valor «content» de la metaetiqueta google-site-verification."><input name="searchConsoleVerification" defaultValue={s.analytics.searchConsoleVerification} className="field font-mono text-[12px]" /></Field>
          </div>
        </Panel>

        <Panel title="Consentimiento de cookies">
          <div className="space-y-3 text-[13px]">
            <label className="flex items-start gap-2.5">
              <input type="radio" name="consentMode" value="builtin" defaultChecked={s.consent.mode === "builtin"} className="mt-0.5 accent-ink" />
              <span><strong className="font-medium">Banner propio + Google Consent Mode v2.</strong> Adecuado para analítica. <span className="text-warn">Para servir anuncios de AdSense a usuarios del EEE, Reino Unido y Suiza, Google exige una CMP certificada compatible con el TCF.</span></span>
            </label>
            <label className="flex items-start gap-2.5">
              <input type="radio" name="consentMode" value="external" defaultChecked={s.consent.mode === "external"} className="mt-0.5 accent-ink" />
              <span><strong className="font-medium">CMP externa certificada</strong> (recomendado con AdSense). Activa el mensaje de consentimiento del RGPD en AdSense → Privacidad y mensajes, o integra otra CMP certificada por Google. El banner propio se desactiva y el enlace «Preferencias de privacidad» abre la CMP de Google.</span>
            </label>
          </div>
        </Panel>

        <Panel title="Afiliados">
          <Field label="Aviso de afiliación" hint="Se muestra junto a los botones de compra y en el pie de página."><textarea name="disclosure" defaultValue={s.affiliates.disclosure} rows={2} className="field" /></Field>
        </Panel>

        <Panel title="Datos legales del titular" description="Se insertan en el aviso legal y la política de privacidad. Déjalos vacíos hasta tener los datos reales.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Titular (persona o empresa)"><input name="ownerName" defaultValue={s.legal.ownerName} className="field" /></Field>
            <Field label="NIF / CIF"><input name="taxId" defaultValue={s.legal.taxId} className="field" /></Field>
            <Field label="Domicilio"><input name="address" defaultValue={s.legal.address} className="field" /></Field>
            <Field label="Datos registrales (si aplica)"><input name="registry" defaultValue={s.legal.registry} className="field" /></Field>
          </div>
        </Panel>

        <Panel title="Redes sociales" description="URLs completas. Se usan en los datos estructurados de la organización.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="X"><input name="x" defaultValue={s.social.x} className="field" /></Field>
            <Field label="Instagram"><input name="instagram" defaultValue={s.social.instagram} className="field" /></Field>
            <Field label="YouTube"><input name="youtube" defaultValue={s.social.youtube} className="field" /></Field>
          </div>
        </Panel>
        <SubmitButton>Guardar ajustes</SubmitButton>
      </ActionForm>
    </AdminPage>
  );
}
