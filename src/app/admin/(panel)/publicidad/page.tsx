import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { AdminPage, Field, Panel } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { AD_PLACEMENTS, adsActive, getSettings } from "@/lib/settings";
import { saveAds } from "../ajustes/actions";

export default async function AdsPage() {
  await requireUser("admin");
  const s = await getSettings();
  return (
    <AdminPage
      title="Publicidad · Google AdSense"
      description="La web funciona igual sin anuncios. Activa AdSense solo cuando tu cuenta y tu sitio estén aprobados. Nunca se muestran anuncios simulados."
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Panel><p className="text-[12px] text-muted">Estado</p><p className="mt-1 font-medium">{adsActive(s) ? "Activo" : "Inactivo"}</p></Panel>
        <Panel><p className="text-[12px] text-muted">ads.txt</p><Link href="/ads.txt" target="_blank" className="mt-1 block font-medium underline">Ver /ads.txt ↗</Link></Panel>
        <Panel><p className="text-[12px] text-muted">Consentimiento</p><p className="mt-1 font-medium">{s.consent.mode === "external" ? "CMP externa" : "Banner propio"}</p></Panel>
      </div>
      {adsActive(s) && s.consent.mode === "builtin" && (
        <p className="mb-6 rounded-sm border border-warn px-4 py-3 text-[13px] text-warn">
          AdSense está activo con el banner propio. Para tráfico del EEE, Reino Unido y Suiza, configura una CMP certificada por Google (Ajustes → Consentimiento).
        </p>
      )}
      <ActionForm action={saveAds} className="space-y-6">
        <Panel title="Cuenta">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ID de editor" hint="AdSense → Cuenta → Información de la cuenta. También puede definirse con NEXT_PUBLIC_ADSENSE_CLIENT."><input name="client" defaultValue={s.ads.client} placeholder="ca-pub-0000000000000000" className="field font-mono" /></Field>
            <div className="space-y-3 pt-6 text-[13px]">
              <label className="flex items-center gap-2"><input type="checkbox" name="enabled" defaultChecked={s.ads.enabled} className="size-4 accent-ink" /> Cargar AdSense en la web</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="showPlaceholders" defaultChecked={s.ads.showPlaceholders} className="size-4 accent-ink" /> Mostrar huecos reservados mientras los bloques estén inactivos (solo maqueta)</label>
            </div>
          </div>
        </Panel>
        <Panel title="Ubicaciones" description="Crea un bloque de anuncios en AdSense para cada ubicación y pega su ID numérico (data-ad-slot). Cada espacio reserva su altura para evitar saltos de contenido.">
          <div className="divide-y divide-line">
            {AD_PLACEMENTS.map((p) => {
              const slot = s.ads.slots[p.id];
              return (
                <div key={p.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_180px_140px_auto] sm:items-end">
                  <div><p className="text-[14px] font-medium">{p.label}</p><p className="text-[12px] text-muted">{p.description}</p></div>
                  <Field label="ID del bloque"><input name={`slot_${p.id}`} defaultValue={slot?.slotId} className="field font-mono" inputMode="numeric" /></Field>
                  <Field label="Formato">
                    <select name={`format_${p.id}`} defaultValue={slot?.format ?? "auto"} className="field">
                      <option value="auto">Adaptable</option><option value="fluid">Fluido</option><option value="rectangle">Rectángulo</option><option value="horizontal">Horizontal</option>
                    </select>
                  </Field>
                  <label className="flex items-center gap-2 pb-2 text-[13px]"><input type="checkbox" name={`enabled_${p.id}`} defaultChecked={slot?.enabled} className="size-4 accent-ink" /> Activa</label>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="Buenas prácticas">
          <ul className="list-inside list-disc space-y-1.5 text-[13px] text-muted">
            <li>No pidas a nadie que haga clic en los anuncios ni los coloques junto a botones que puedan confundirse con ellos.</li>
            <li>No hagas clic en tus propios anuncios.</li>
            <li>Mantén más contenido que publicidad en cada página.</li>
            <li>La aprobación de AdSense no está garantizada: prioriza contenido original y útil.</li>
          </ul>
        </Panel>
        <SubmitButton>Guardar publicidad</SubmitButton>
      </ActionForm>
    </AdminPage>
  );
}
