import Link from "next/link";
import { notFound } from "next/navigation";
import candidates from "@/data/catalogo/candidatas-wikimedia.json";
import { FocalPicker } from "@/components/admin/FocalPicker";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { AdminPage, Field, Panel } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRenderable, photoProblems, SLOTS } from "@/lib/devices";
import { formatDateTime } from "@/lib/format";
import { LICENSES } from "@/lib/images/licenses";
import type { DeviceSlot, ImageRef, LicenseCode } from "@/lib/types";
import { approveDevicePhoto, importCommonsAction, importUrlDevicePhoto, removeDevicePhoto, updateDevicePhoto, uploadDevicePhoto } from "../actions";

const LICENSE_OPTS: LicenseCode[] = ["cc-by-sa", "cc-by", "cc0", "pdm", "own", "press", "retailer"];

function Hidden({ deviceId, slot }: { deviceId: string; slot: DeviceSlot }) {
  return (
    <>
      <input type="hidden" name="deviceId" value={deviceId} />
      <input type="hidden" name="slot" value={slot} />
    </>
  );
}

function LicenseInputs({ meta }: { meta?: ImageRef["meta"] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Licencia o permiso">
        <select name="license" defaultValue={meta?.license ?? "cc-by-sa"} className="field">
          {LICENSE_OPTS.map((l) => (
            <option key={l} value={l}>
              {LICENSES[l].name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Autoría" hint="Obligatoria en licencias CC BY y CC BY-SA.">
        <input name="author" defaultValue={meta?.author} className="field" placeholder="Nombre del autor" />
      </Field>
      <Field label="Página de origen">
        <input name="sourceUrl" defaultValue={meta?.sourceUrl} className="field font-mono text-[12px]" placeholder="https://commons.wikimedia.org/wiki/File:…" />
      </Field>
      <Field label="Cambios realizados" hint="CC BY-SA obliga a indicarlos (recorte, conversión…).">
        <input name="changes" defaultValue={meta?.changes ?? "Redimensionada y convertida a WebP"} className="field" />
      </Field>
      <Field label="Permiso o acuerdo" hint="Obligatorio en imágenes de prensa o de tiendas: quién lo autoriza y en qué términos." className="sm:col-span-2">
        <input name="permissionNote" defaultValue={meta?.permissionNote} className="field" />
      </Field>
    </div>
  );
}

export default async function DevicePhotos({ params }: PageProps<"/admin/imagenes/biblioteca/[id]">) {
  await requireUser();
  const { id } = await params;
  const [device, phones] = await Promise.all([db().get("devices", id), db().list("phones")]);
  if (!device) notFound();
  const phone = phones.find((p) => p.deviceId === device.id);
  const name = `${device.brand} ${device.model}`;
  const cands = candidates.filter((c) => c.deviceId === device.id);

  return (
    <AdminPage
      title={name}
      back={{ href: "/admin/imagenes/biblioteca", label: "Biblioteca de móviles" }}
      description={
        <>
          {device.year} · prioridad {device.priority} · fase {device.phase} · <span className="font-mono text-[12px]">{device.id}</span>
          {device.manufacturerReference && (
            <>
              {" · "}
              <a href={device.manufacturerReference} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                Referencia del fabricante
              </a>
            </>
          )}
          {phone && (
            <>
              {" · "}
              <Link href={`/admin/moviles/${phone.id}`} className="underline underline-offset-2">
                Ficha enlazada
              </Link>
            </>
          )}
        </>
      }
    >
      <p className="mb-6 rounded-md border border-line bg-surface px-4 py-3 text-[13px] text-ink-2">
        Toda foto entra como <strong>propuesta</strong>. Solo se publica al aprobarla, tras comprobar que muestra exactamente el {name} y que su licencia permite uso comercial y modificación. Una página del fabricante sirve para identificar el modelo, pero no da permiso para copiar sus fotos.
      </p>

      {cands.length > 0 && (
        <Panel title="Candidatas de Wikimedia Commons" description="Del archivo candidatas_wikimedia.csv. Al importarlas se lee la licencia real desde Commons; después debes revisarlas y aprobarlas.">
          <ul className="divide-y divide-line text-[13px]">
            {cands.map((c) => (
              <li key={c.sourceUrl} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <span>
                  <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2">
                    {decodeURIComponent(c.sourceUrl.split("/File:")[1] ?? c.sourceUrl).replace(/_/g, " ")}
                  </a>
                  <span className="block text-muted">
                    {SLOTS.find((s) => s.id === c.slot)?.label} · {c.author} · {c.license} · {c.note}
                  </span>
                </span>
                <ActionForm action={importCommonsAction}>
                  <Hidden deviceId={device.id} slot={c.slot as DeviceSlot} />
                  <input type="hidden" name="url" value={c.sourceUrl} />
                  <SubmitButton variant="secondary">Importar como {SLOTS.find((s) => s.id === c.slot)?.label.toLowerCase()}</SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="mt-6 grid gap-6">
        {SLOTS.map(({ id: slot, label, required }) => {
          const ref = device.photos[slot];
          const m = ref?.meta;
          const problems = ref ? photoProblems(ref) : [];
          const approved = isRenderable(ref);
          return (
            <Panel key={slot} title={`${label}${required ? " · imprescindible" : " · opcional"}`}>
              <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                <div>
                  <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-sm bg-surface text-[12px] text-faint">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {ref?.src ? <img src={ref.src} alt={ref.alt} className="h-full w-full object-contain" /> : "Sin foto"}
                  </div>
                  <p className={`mt-2 text-[12px] font-medium ${approved ? "text-ink" : "text-muted"}`}>
                    {!ref ? "Pendiente: no hay ningún archivo." : approved ? "✓ Aprobada y visible en la web" : m?.status === "approved" ? "Aprobada, pero no se muestra (revisa la licencia)" : "Propuesta: no se muestra hasta aprobarla"}
                  </p>
                </div>

                <div className="space-y-5">
                  {ref && m && (
                    <dl className="grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
                      <div>
                        <dt className="text-muted">Licencia</dt>
                        <dd>{m.licenseName}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Autoría</dt>
                        <dd>{m.author ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Origen</dt>
                        <dd className="truncate">
                          {m.sourceUrl ? (
                            <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                              {m.sourceUrl}
                            </a>
                          ) : (
                            "—"
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted">Cambios</dt>
                        <dd>{m.changes ?? "—"}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-muted">Identificación del modelo</dt>
                        <dd>{m.permissionNote ?? "—"}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-muted">Aprobación</dt>
                        <dd>{m.approvedAt ? `${formatDateTime(m.approvedAt)} · ${m.approvedBy ?? ""}` : "Sin aprobar"}</dd>
                      </div>
                    </dl>
                  )}

                  {problems.length > 0 && (
                    <ul className="rounded-sm border border-live px-3 py-2 text-[13px] text-live">
                      {problems.map((p) => (
                        <li key={p}>• {p}</li>
                      ))}
                    </ul>
                  )}

                  {ref && !approved && problems.length === 0 && (
                    <ActionForm action={approveDevicePhoto} className="flex flex-wrap items-center gap-3">
                      <Hidden deviceId={device.id} slot={slot} />
                      <label className="flex items-center gap-2 text-[13px]">
                        <input type="checkbox" name="confirmModel" required /> He comprobado que muestra exactamente el {name}
                      </label>
                      <SubmitButton>Aprobar y publicar</SubmitButton>
                    </ActionForm>
                  )}

                  {ref && m && (
                    <details className="rounded-sm border border-line">
                      <summary className="cursor-pointer px-3 py-2 text-[13px] font-medium">Editar datos y recorte</summary>
                      <ActionForm action={updateDevicePhoto} className="space-y-4 p-3">
                        <Hidden deviceId={device.id} slot={slot} />
                        <Field label="Texto alternativo">
                          <input name="alt" defaultValue={ref.alt} className="field" />
                        </Field>
                        <LicenseInputs meta={m} />
                        <FocalPicker src={ref.src} x={m.focalX} y={m.focalY} crops={[{ label: "Ficha 4:5", ratio: "4 / 5" }, { label: "Lista 1:1", ratio: "1 / 1" }]} />
                        <SubmitButton variant="secondary">Guardar</SubmitButton>
                      </ActionForm>
                    </details>
                  )}

                  {ref && (
                    <ActionForm action={removeDevicePhoto} className="flex flex-wrap items-center gap-3">
                      <Hidden deviceId={device.id} slot={slot} />
                      <label className="flex items-center gap-2 text-[13px] text-muted">
                        <input type="checkbox" name="confirmRemove" required /> Quitar esta foto de la vista (el archivo se conserva en Medios)
                      </label>
                      <button className="btn-ghost btn-sm text-live">Quitar</button>
                    </ActionForm>
                  )}

                  <details className="rounded-sm border border-line" open={!ref}>
                    <summary className="cursor-pointer px-3 py-2 text-[13px] font-medium">{ref ? "Sustituir" : "Añadir"} {label.toLowerCase()}</summary>
                    <div className="grid gap-6 p-3">
                      <ActionForm action={importCommonsAction} className="space-y-3">
                        <Hidden deviceId={device.id} slot={slot} />
                        <Field label="Desde Wikimedia Commons" hint="Pega la página del archivo. La licencia, el autor y las categorías se leen de Commons; solo se aceptan licencias con uso comercial y modificación.">
                          <input name="url" className="field font-mono text-[12px]" placeholder="https://commons.wikimedia.org/wiki/File:…" required />
                        </Field>
                        <SubmitButton variant="secondary">Importar de Commons</SubmitButton>
                      </ActionForm>

                      <ActionForm action={uploadDevicePhoto} className="space-y-3 border-t border-line pt-5">
                        <Hidden deviceId={device.id} slot={slot} />
                        <Field label="Subir foto" hint="JPG, PNG, WebP o AVIF; mínimo 500 px. Se guarda optimizada en WebP.">
                          <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif" className="field" required />
                        </Field>
                        <Field label="Texto alternativo">
                          <input name="alt" defaultValue={name} className="field" />
                        </Field>
                        <LicenseInputs />
                        <SubmitButton variant="secondary">Subir como propuesta</SubmitButton>
                      </ActionForm>

                      <ActionForm action={importUrlDevicePhoto} className="space-y-3 border-t border-line pt-5">
                        <Hidden deviceId={device.id} slot={slot} />
                        <Field label="Importar por URL" hint="Solo con permiso o licencia que autorice este uso. Se bloquean redes privadas y archivos que no sean imágenes.">
                          <input name="url" className="field font-mono text-[12px]" placeholder="https://…" required />
                        </Field>
                        <LicenseInputs />
                        <SubmitButton variant="secondary">Importar como propuesta</SubmitButton>
                      </ActionForm>
                    </div>
                  </details>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </AdminPage>
  );
}
