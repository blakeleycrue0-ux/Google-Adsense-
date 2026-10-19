import { ActionForm, ConfirmButton, SubmitButton } from "@/components/admin/forms";
import { ImageInput } from "@/components/admin/ImageInput";
import { AdminPage, Field } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatPrice, isoToMadridLocal } from "@/lib/format";
import type { Deal, Store } from "@/lib/types";
import { deleteDeal, saveDeal } from "./actions";

function DealForm({ d, stores, url, library }: { d?: Deal; stores: Store[]; url?: string; library: { url: string; alt: string }[] }) {
  return (
    <ActionForm action={saveDeal} className="grid gap-4 sm:grid-cols-4">
      {d && <input type="hidden" name="id" value={d.id} />}
      <Field label="Producto" className="sm:col-span-2"><input name="title" defaultValue={d?.title} className="field" required /></Field>
      <Field label="Tipo">
        <select name="productType" defaultValue={d?.productType ?? "movil"} className="field">
          {["movil", "auriculares", "portatil", "tablet", "reloj", "otro"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Tienda">
        <select name="storeId" defaultValue={d?.storeId ?? ""} className="field" required>
          <option value="" disabled>Elige…</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <Field label="Precio actual (€)"><input name="price" type="number" step="0.01" defaultValue={d?.price} className="field" required /></Field>
      <Field label="Precio anterior (€)" hint="Solo si la tienda lo muestra de forma verificable."><input name="previousPrice" type="number" step="0.01" defaultValue={d?.previousPrice} className="field" /></Field>
      <Field label="Válida hasta"><input name="expiresAt" type="datetime-local" defaultValue={isoToMadridLocal(d?.expiresAt)} className="field" /></Field>
      <Field label="URL del producto en la tienda"><input name="url" defaultValue={url} className="field font-mono text-[12px]" required /></Field>
      <div className="sm:col-span-2"><span className="label">Imagen</span><ImageInput name="imageSrc" defaultValue={d?.image?.src} library={library} /></div>
      <Field label="Notas internas" className="sm:col-span-2"><textarea name="notes" defaultValue={d?.notes} rows={3} className="field" /></Field>
      <label className="flex items-center gap-2 text-[13px] sm:col-span-2"><input type="checkbox" name="previousVerified" className="size-4 accent-ink" /> Confirmo que el precio anterior aparece en la tienda</label>
      <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" name="active" defaultChecked={d?.active ?? true} className="size-4 accent-ink" /> Publicada</label>
      <div className="sm:text-right"><SubmitButton>{d ? "Guardar y marcar comprobada" : "Crear oferta"}</SubmitButton></div>
    </ActionForm>
  );
}

export default async function DealsAdmin() {
  await requireUser();
  const [deals, stores, links, media] = await Promise.all([db().list("deals"), db().list("stores"), db().list("links"), db().list("media")]);
  const urlOf = new Map(links.map((l) => [l.id, l.targetUrl]));
  const library = media.map((m) => ({ url: m.url, alt: m.alt }));
  return (
    <AdminPage title="Ofertas" description="Al guardar, la fecha de comprobación se actualiza a ahora. No publiques descuentos que no puedas verificar.">
      <details className="mb-6 rounded-md border border-line bg-paper">
        <summary className="cursor-pointer px-5 py-4 font-medium">+ Nueva oferta</summary>
        <div className="border-t border-line p-5"><DealForm stores={stores} library={library} /></div>
      </details>
      <div className="space-y-3">
        {deals.sort((a, b) => b.checkedAt.localeCompare(a.checkedAt)).map((d) => (
          <details key={d.id} className="rounded-md border border-line bg-paper">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-5 py-4">
              <span className="font-medium">{d.title}</span>
              <span className="text-[12px] text-muted">
                {formatPrice(d.price)} · {stores.find((s) => s.id === d.storeId)?.name} · {d.isDemo ? "DEMO" : `comprobada ${formatDate(d.checkedAt)}`} · {d.active ? "publicada" : "oculta"}
              </span>
            </summary>
            <div className="border-t border-line p-5">
              <DealForm d={d} stores={stores} url={urlOf.get(d.linkId)} library={library} />
              <ActionForm action={deleteDeal} className="mt-3 border-t border-line pt-3">
                <input type="hidden" name="id" value={d.id} />
                <ConfirmButton>Eliminar oferta</ConfirmButton>
              </ActionForm>
            </div>
          </details>
        ))}
      </div>
    </AdminPage>
  );
}
