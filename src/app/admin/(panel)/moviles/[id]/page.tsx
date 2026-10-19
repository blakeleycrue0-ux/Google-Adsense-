import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/admin/forms";
import { AdminPage, Field, Panel } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { TIER_LABEL, TIER_ORDER } from "@/lib/phones";
import type { Phone } from "@/lib/types";
import { deletePhone, savePhone } from "../actions";

export default async function PhoneEditor({ params }: PageProps<"/admin/moviles/[id]">) {
  await requireUser();
  const { id } = await params;
  const [phones, stores, links] = await Promise.all([db().list("phones"), db().list("stores"), db().list("links")]);
  const phone: Phone | undefined = id === "nuevo" ? undefined : phones.find((p) => p.id === id);
  if (id !== "nuevo" && !phone) notFound();
  const s = phone?.specs;
  const linkUrl = new Map(links.map((l) => [l.id, l.targetUrl]));
  const offerRows = [...(phone?.offers ?? []), ...Array.from({ length: 2 }, () => undefined)];

  return (
    <AdminPage
      title={phone ? `${phone.brand} ${phone.model}` : "Nueva ficha de móvil"}
      back={{ href: "/admin/moviles", label: "Fichas de móviles" }}
      actions={
        phone && (
          <>
            <Link href={`/moviles/${phone.slug}`} target="_blank" className="btn-secondary btn-sm">Ver en la web ↗</Link>
            <form action={deletePhone}>
              <input type="hidden" name="id" value={phone.id} />
              <ConfirmButton message="¿Eliminar esta ficha?">Eliminar</ConfirmButton>
            </form>
          </>
        )
      }
    >
      <ActionForm action={savePhone} className="space-y-6">
        {phone && <input type="hidden" name="id" value={phone.id} />}
        <Panel title="Identificación">
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Marca"><input name="brand" defaultValue={phone?.brand} className="field" required /></Field>
            <Field label="Modelo"><input name="model" defaultValue={phone?.model} className="field" required /></Field>
            <Field label="Año"><input name="releaseYear" type="number" defaultValue={phone?.releaseYear ?? new Date().getFullYear()} className="field" /></Field>
            <Field label="Sistema">
              <select name="os" defaultValue={phone?.os ?? "android"} className="field"><option value="android">Android</option><option value="ios">iOS</option></select>
            </Field>
            <Field label="Resumen" className="sm:col-span-4"><textarea name="summary" defaultValue={phone?.summary} rows={2} className="field" /></Field>
            <Field label="Web oficial (fuente de especificaciones)" className="sm:col-span-2"><input name="officialUrl" defaultValue={phone?.officialUrl} className="field" /></Field>
            <Field label="Slug (URL)" className="sm:col-span-2"><input name="slug" defaultValue={phone?.slug} className="field font-mono text-[12px]" /></Field>
          </div>
        </Panel>

        <Panel title="Fotografía" description="Debe mostrar el modelo exacto. Se busca, se comprueba la licencia y se aprueba en el gestor de imágenes.">
          <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {phone?.image.src && <img src={phone.image.src} alt="" className="h-full w-full object-contain p-1" />}
            </div>
            <div className="space-y-3">
              <p className="text-[13px] text-muted">
                {!phone ? "Guarda la ficha para buscar su fotografía." : phone.image.illustrative ? "Ilustración de demostración: pendiente de una fotografía autorizada del modelo." : phone.image.meta ? `✓ ${phone.image.meta.licenseName}${phone.image.meta.author ? ` · ${phone.image.meta.author}` : ""}` : "Imagen sin procedencia registrada."}
              </p>
              {phone && <Link href={`/admin/imagenes/phone/${phone.id}`} className="btn-secondary btn-sm">Gestionar fotografía</Link>}
              <Field label="Texto alternativo"><input name="imageAlt" defaultValue={phone?.image.alt} className="field" /></Field>
              <Field label="Colores comercializados" hint="Separados por comas (p. ej. negro, azul). Se usan para descartar fotos de otra variante de color."><input name="colors" defaultValue={phone?.colors?.join(", ")} className="field" /></Field>
            </div>
          </div>
        </Panel>

        <Panel title="Especificaciones" description="Cópialas de la ficha oficial. No añadas resultados de pruebas que no se hayan realizado.">
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Pantalla (pulgadas)"><input name="displayInches" type="number" step="0.01" defaultValue={s?.displayInches} className="field" required /></Field>
            <Field label="Tipo de pantalla"><input name="displayType" defaultValue={s?.displayType} className="field" required /></Field>
            <Field label="Frecuencia (Hz)"><input name="refreshHz" type="number" defaultValue={s?.refreshHz} className="field" required /></Field>
            <Field label="Resolución"><input name="resolution" defaultValue={s?.resolution} className="field" required /></Field>
            <Field label="Procesador" className="sm:col-span-2"><input name="chipset" defaultValue={s?.chipset} className="field" required /></Field>
            <Field label="Gama del procesador" hint="Clasificación editorial, no un resultado de pruebas.">
              <select name="performanceTier" defaultValue={phone?.performanceTier ?? "media"} className="field">
                {TIER_ORDER.map((t) => <option key={t} value={t}>{TIER_LABEL[t]}</option>)}
              </select>
            </Field>
            <Field label="Actualizaciones (años)"><input name="osUpdatesYears" type="number" defaultValue={s?.osUpdatesYears} className="field" /></Field>
            <Field label="RAM (GB)" hint="Separadas por comas"><input name="ramGB" defaultValue={s?.ramGB.join(", ")} className="field" required /></Field>
            <Field label="Almacenamiento (GB)" hint="1 TB = 1024"><input name="storageGB" defaultValue={s?.storageGB.join(", ")} className="field" required /></Field>
            <Field label="Batería (mAh)"><input name="batteryMah" type="number" defaultValue={s?.batteryMah} className="field" required /></Field>
            <Field label="Carga por cable (W)"><input name="chargingW" type="number" defaultValue={s?.chargingW} className="field" /></Field>
            <Field label="Cámara principal (MP)"><input name="mainCameraMp" type="number" defaultValue={s?.mainCameraMp} className="field" required /></Field>
            <Field label="Ultra gran angular (MP)"><input name="ultrawideMp" type="number" defaultValue={s?.ultrawideMp} className="field" /></Field>
            <Field label="Teleobjetivo (MP)"><input name="telephotoMp" type="number" defaultValue={s?.telephotoMp} className="field" /></Field>
            <Field label="Zoom del teleobjetivo"><input name="telephotoZoom" defaultValue={s?.telephotoZoom} className="field" placeholder="3x" /></Field>
            <Field label="Cámara frontal (MP)"><input name="frontCameraMp" type="number" defaultValue={s?.frontCameraMp} className="field" required /></Field>
            <Field label="Peso (g)"><input name="weightG" type="number" defaultValue={s?.weightG} className="field" required /></Field>
            <Field label="Certificación IP"><input name="ipRating" defaultValue={s?.ipRating} className="field" /></Field>
            <label className="flex items-center gap-2 pt-6 text-[13px]"><input type="checkbox" name="fiveG" defaultChecked={s?.fiveG ?? true} className="size-4 accent-ink" /> 5G</label>
          </div>
          <label className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-[13px]">
            <input type="checkbox" name="specsVerified" defaultChecked={phone?.specsVerified} className="size-4 accent-ink" />
            He verificado estas especificaciones con la ficha oficial del fabricante
          </label>
        </Panel>

        <Panel title="Valoración editorial">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ventajas (una por línea)"><textarea name="pros" defaultValue={phone?.pros.join("\n")} rows={5} className="field" /></Field>
            <Field label="Inconvenientes (uno por línea)"><textarea name="cons" defaultValue={phone?.cons.join("\n")} rows={5} className="field" /></Field>
          </div>
          <fieldset className="mt-5">
            <legend className="label">Alternativas</legend>
            <div className="grid gap-1.5 sm:grid-cols-3">
              {phones.filter((p) => p.id !== phone?.id).map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-[13px]">
                  <input type="checkbox" name="alternativeIds" value={p.id} defaultChecked={phone?.alternativeIds.includes(p.id)} className="size-4 accent-ink" />
                  {p.brand} {p.model}
                </label>
              ))}
            </div>
          </fieldset>
        </Panel>

        <Panel title="Precios y tiendas" description="Cada fila crea un enlace de compra administrable (/go/…). Marca «comprobado» solo tras ver el precio en la tienda; si no, se mostrará como no verificado.">
          <div className="space-y-3">
            {offerRows.map((o, i) => (
              <div key={o?.id ?? `new-${i}`} className="grid gap-2 rounded-sm border border-line p-3 sm:grid-cols-[150px_100px_120px_1fr]">
                {o && <input type="hidden" name={`offer_${i}_id`} value={o.id} />}
                <select name={`offer_${i}_store`} defaultValue={o?.storeId ?? ""} className="field" aria-label="Tienda">
                  <option value="">{o ? "Eliminar fila" : "Tienda…"}</option>
                  {stores.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                </select>
                <input name={`offer_${i}_price`} type="number" step="0.01" defaultValue={o?.price} placeholder="Precio €" className="field" aria-label="Precio" />
                <input name={`offer_${i}_variant`} defaultValue={o?.variant} placeholder="8/128 GB" className="field" aria-label="Variante" />
                <input name={`offer_${i}_url`} defaultValue={o ? linkUrl.get(o.linkId) : ""} placeholder="https://tienda…/producto" className="field font-mono text-[12px]" aria-label="URL de la tienda" />
                <label className="flex items-center gap-2 text-[12px] text-muted sm:col-span-4">
                  <input type="checkbox" name={`offer_${i}_verified`} className="size-4 accent-ink" />
                  Precio comprobado ahora en la tienda
                  {o && <span className="ml-2">· Estado actual: {o.source === "demo" ? "demostración / no verificado" : `comprobado el ${formatDate(o.checkedAt)}`}</span>}
                </label>
              </div>
            ))}
          </div>
        </Panel>

        <div className="sticky bottom-4 flex justify-end">
          <SubmitButton className="shadow-lg">Guardar ficha</SubmitButton>
        </div>
      </ActionForm>
    </AdminPage>
  );
}
