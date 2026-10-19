import Link from "next/link";
import { notFound } from "next/navigation";
import { FocalPicker } from "@/components/admin/FocalPicker";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { AdminPage, Field, Panel, StatusPill } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { isPublished } from "@/lib/content";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { LICENSES } from "@/lib/images/licenses";
import { providerInfo } from "@/lib/images/providers";
import { bestCandidate, defaultQuery, imageState, loadTarget } from "@/lib/images/search";
import type { ImageCandidate, ImageRef, LicenseCode } from "@/lib/types";
import { importUrlForTarget, searchAction, selectCandidate, updateCurrentImage, uploadForTarget, useLibraryImage } from "../../actions";

const COVER_CROPS = [
  { label: "Portada 3:2", ratio: "3 / 2" },
  { label: "Artículo 16:10", ratio: "16 / 10" },
  { label: "Lista 4:3", ratio: "4 / 3" },
];
const PHONE_CROPS = [{ label: "Ficha 4:5", ratio: "4 / 5" }];

const STATE_LABEL = { approved: "Aprobada", proposed: "Propuesta pendiente", pending: "Pendiente" } as const;

function LicenseFields({ defaultLicense = "own" }: { defaultLicense?: LicenseCode }) {
  const opts: LicenseCode[] = ["own", "press", "retailer", "cc0", "pdm", "cc-by", "cc-by-sa"];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Licencia o permiso">
        <select name="license" defaultValue={defaultLicense} className="field">
          {opts.map((l) => (
            <option key={l} value={l}>
              {LICENSES[l].name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Autoría">
        <input name="author" className="field" placeholder="Nombre del autor o empresa" />
      </Field>
      <Field label="Página de origen">
        <input name="sourceUrl" className="field font-mono text-[12px]" placeholder="https://…" />
      </Field>
      <Field label="Permiso / condiciones" hint="Obligatorio en imágenes de prensa y de tiendas: quién lo autoriza y en qué términos.">
        <input name="permissionNote" className="field" placeholder="Kit de prensa de Samsung, uso editorial autorizado…" />
      </Field>
    </div>
  );
}

function CandidateCard({ c, type, id, defaultAlt, best }: { c: ImageCandidate; type: string; id: string; defaultAlt: string; best: boolean }) {
  return (
    <li className={`flex flex-col overflow-hidden rounded-md border bg-paper ${best ? "border-ink" : "border-line"}`}>
      <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="relative block aspect-[4/3] bg-surface" title="Ver en la fuente">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.previewUrl} alt="" className={`h-full w-full ${type === "phone" ? "object-contain" : "object-cover"}`} loading="lazy" referrerPolicy="no-referrer" />
        {best && <span className="absolute left-2 top-2 rounded-xs bg-ink px-1.5 py-0.5 text-[10px] font-medium uppercase text-paper">Propuesta</span>}
      </a>
      <div className="flex flex-1 flex-col gap-2 p-3 text-[12px]">
        <p className="line-clamp-2 font-medium text-ink">{c.title}</p>
        <p className="text-muted">
          {c.provider} · {c.width && c.height ? `${c.width}×${c.height}` : "tamaño desconocido"}
          {c.author ? ` · ${c.author}` : ""}
        </p>
        <p>
          <span className={`rounded-xs px-1.5 py-0.5 ${c.usable ? "bg-surface text-ink" : "bg-live/10 text-live"}`}>{c.licenseName}</span>
        </p>
        {c.blockedReason && <p className="text-live">{c.blockedReason}</p>}
        {c.reasons.length > 0 && <p className="text-muted">{c.reasons.join(" · ")}</p>}
        {!c.matched && c.usable && <p className="text-warn">No se ha podido confirmar que corresponda a este contenido.</p>}
        {c.usable && (
          <ActionForm action={selectCandidate} className="mt-auto space-y-2 border-t border-line pt-2">
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="key" value={c.key} />
            <input name="alt" defaultValue={defaultAlt} className="field h-8 text-[12px]" aria-label="Texto alternativo" />
            {!c.matched && (
              <label className="flex items-start gap-1.5 text-[11px] text-ink-2">
                <input type="checkbox" name="confirm" className="mt-0.5 size-3.5 accent-ink" /> He comprobado que la imagen corresponde a este contenido
              </label>
            )}
            <SubmitButton variant={best ? "primary" : "secondary"} className="btn-sm w-full">
              {best ? "Aprobar propuesta" : "Usar esta imagen"}
            </SubmitButton>
          </ActionForm>
        )}
      </div>
    </li>
  );
}

export default async function ImageManager({ params }: PageProps<"/admin/imagenes/[type]/[id]">) {
  await requireUser();
  const { type, id } = await params;
  if (type !== "post" && type !== "phone") notFound();
  const target = await loadTarget(type, id);
  if (!target || target.type === "detected") notFound();
  const [search, media] = await Promise.all([db().get("imageSearches", `${type}:${id}`), db().list("media")]);

  const image: ImageRef = target.type === "post" ? target.post.cover : target.phone.image;
  const title = target.type === "post" ? target.post.title : `${target.phone.brand} ${target.phone.model}`;
  const state = imageState(image, search);
  const best = search ? bestCandidate(search) : null;
  const defaultAlt = target.type === "phone" ? `Fotografía del ${target.phone.brand} ${target.phone.model}` : "";
  const editHref = target.type === "post" ? `/admin/articulos/${id}` : `/admin/moviles/${id}`;
  const publicHref = target.type === "post" ? (isPublished(target.post) ? `/noticias/${target.post.slug}` : null) : `/moviles/${target.phone.slug}`;
  const providers = providerInfo();
  const library = media.filter((m) => m.meta).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)).slice(0, 24);
  const m = image.meta;

  return (
    <AdminPage
      title={title}
      description={target.type === "post" ? "Imagen principal del artículo" : "Fotografía de la ficha (debe ser el modelo exacto)"}
      back={{ href: "/admin/imagenes", label: "Imágenes" }}
      actions={
        <>
          <Link href={editHref} className="btn-secondary btn-sm">Editar contenido</Link>
          {publicHref && <Link href={publicHref} target="_blank" className="btn-secondary btn-sm">Ver en la web ↗</Link>}
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="Imagen actual">
          <p className="mb-3 flex items-center gap-2 text-[13px] text-muted">
            Estado: <StatusPill status={state === "approved" ? "published" : state === "proposed" ? "review" : "draft"} />
            <span>{STATE_LABEL[state]}</span>
          </p>
          {image.src ? (
            <ActionForm action={updateCurrentImage} className="space-y-4">
              <input type="hidden" name="type" value={type} />
              <input type="hidden" name="id" value={id} />
              <FocalPicker src={image.src} x={m?.focalX} y={m?.focalY} crops={type === "phone" ? PHONE_CROPS : COVER_CROPS} />
              <Field label="Texto alternativo" hint="Describe lo que se ve en la imagen, no el titular.">
                <input name="alt" defaultValue={image.alt} className="field" />
              </Field>
              <SubmitButton variant="secondary">Guardar texto y encuadre</SubmitButton>
            </ActionForm>
          ) : (
            <p className="rounded-sm border border-dashed border-line-strong px-4 py-10 text-center text-[14px] text-muted">Sin imagen asignada.</p>
          )}
          {image.illustrative && <p className="mt-3 text-[13px] text-warn">Es una ilustración de demostración: sustitúyela por una fotografía autorizada.</p>}
        </Panel>

        <Panel title="Procedencia y licencia">
          {m ? (
            <dl className="space-y-2 text-[13px]">
              {[
                ["Proveedor", m.provider],
                ["Licencia", m.licenseName],
                ["Autoría", m.author ?? "—"],
                ["Permiso", m.permissionNote ?? "—"],
                ["Servida desde", m.hotlinked ? "CDN del proveedor" : "Nuestro almacenamiento"],
                ["Atribución", m.attributionRequired ? "Obligatoria (se muestra en la web)" : "No obligatoria"],
                ["Aprobada", m.approvedAt ? `${formatDateTime(m.approvedAt)} · ${m.approvedBy ?? ""}` : "—"],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[110px_1fr] gap-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="break-words">{v}</dd>
                </div>
              ))}
              {m.sourceUrl && (
                <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" className="block text-[12px] underline">
                  Ver página de origen ↗
                </a>
              )}
              {m.licenseUrl && (
                <a href={m.licenseUrl} target="_blank" rel="noopener noreferrer" className="block text-[12px] underline">
                  Texto de la licencia ↗
                </a>
              )}
            </dl>
          ) : (
            <p className="text-[13px] text-muted">{!image.src ? "Sin imagen." : image.illustrative ? "Ilustración generada para la demostración (sin licencia de terceros)." : "Imagen anterior al sistema de licencias: sin procedencia registrada."}</p>
          )}
        </Panel>
      </div>

      <Panel title="Buscar fotografías autorizadas" className="mt-6" description="Se consultan los bancos configurados y se descartan licencias no comerciales, sin modificaciones o desconocidas.">
        <ActionForm action={searchAction} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="id" value={id} />
          <Field label="Búsqueda" hint={type === "phone" ? "Para fichas se exige el nombre exacto del modelo en la descripción de la imagen." : "Usa términos concretos del tema (mejor en inglés para los bancos internacionales)."}>
            <input name="query" defaultValue={search?.query ?? defaultQuery(target)} className="field" />
          </Field>
          <SubmitButton>Buscar</SubmitButton>
          <div className="flex flex-wrap gap-4 text-[13px] sm:col-span-2">
            {providers.map((p) => (
              <label key={p.id} className={`flex items-center gap-1.5 ${p.configured ? "" : "text-faint"}`}>
                <input type="checkbox" name="providers" value={p.id} defaultChecked={p.configured} disabled={!p.configured} className="size-4 accent-ink" />
                {p.name}
                {!p.configured && <span className="text-[11px]">(falta {p.needs})</span>}
              </label>
            ))}
          </div>
        </ActionForm>

        {search && (
          <div className="mt-6">
            <p className="text-[12px] text-muted">
              Búsqueda «{search.query}» · {formatDateTime(search.createdAt)} · {search.origin === "auto" ? "automática" : "manual"} · {search.candidates.length} resultados
            </p>
            {search.errors.length > 0 && (
              <ul className="mt-2 space-y-1 rounded-sm border border-warn px-3 py-2 text-[12px] text-warn">
                {search.errors.map((e) => (
                  <li key={e.provider}>
                    <strong className="font-medium">{e.provider}:</strong> {e.message}
                  </li>
                ))}
              </ul>
            )}
            {search.candidates.length === 0 ? (
              <p className="mt-4 rounded-sm border border-dashed border-line-strong px-4 py-8 text-center text-[13px] text-muted">
                Sin resultados. El contenido queda pendiente: sube una imagen propia o una imagen de prensa con permiso.
              </p>
            ) : (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {search.candidates.map((c) => (
                  <CandidateCard key={c.key} c={c} type={type} id={id} defaultAlt={defaultAlt || c.description?.slice(0, 140) || c.title} best={best?.key === c.key} />
                ))}
              </ul>
            )}
          </div>
        )}
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Subir imagen propia o de prensa" description="JPG, PNG, WebP o AVIF · máx. 25 MB. Se optimiza a WebP y se generan tamaños responsive.">
          <ActionForm action={uploadForTarget} className="space-y-3">
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="id" value={id} />
            <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="field py-1.5 text-[13px]" />
            <Field label="Texto alternativo"><input name="alt" defaultValue={defaultAlt} className="field" required /></Field>
            <LicenseFields />
            <SubmitButton>Subir y asignar</SubmitButton>
          </ActionForm>
        </Panel>

        <Panel title="Imagen por URL" description="Para fotografías oficiales de prensa o de programas de afiliación. Indica siempre el permiso.">
          <ActionForm action={importUrlForTarget} className="space-y-3">
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="id" value={id} />
            <Field label="URL de la imagen"><input name="url" type="url" className="field font-mono text-[12px]" placeholder="https://…" required /></Field>
            <Field label="Texto alternativo"><input name="alt" defaultValue={defaultAlt} className="field" required /></Field>
            <LicenseFields defaultLicense="press" />
            <label className="flex items-start gap-2 text-[12px] text-ink-2">
              <input type="checkbox" name="hotlink" className="mt-0.5 size-4 accent-ink" />
              Servirla desde su origen sin copiarla (lo exigen algunos programas de afiliación)
            </label>
            <SubmitButton>Importar y asignar</SubmitButton>
          </ActionForm>
        </Panel>
      </div>

      {library.length > 0 && (
        <Panel title="Desde la biblioteca" description="Imágenes ya subidas con licencia registrada." className="mt-6">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {library.map((md) => (
              <li key={md.id} className="overflow-hidden rounded-sm border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={md.url} alt={md.alt} className="aspect-[4/3] w-full bg-surface object-cover" loading="lazy" />
                <ActionForm action={useLibraryImage} className="p-2">
                  <input type="hidden" name="type" value={type} />
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="mediaId" value={md.id} />
                  <p className="mb-1 truncate text-[11px] text-muted">{md.meta?.licenseName}</p>
                  <SubmitButton variant="secondary" className="btn-sm w-full">Usar</SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </AdminPage>
  );
}
