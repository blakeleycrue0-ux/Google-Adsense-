import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { AdminPage, Field, Panel } from "@/components/admin/ui";
import { buildOutboundUrl } from "@/lib/affiliate";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { clickStats } from "@/lib/stats";
import type { AffiliateLink, Store } from "@/lib/types";
import { saveLink } from "./actions";

function LinkForm({ l, stores }: { l?: AffiliateLink; stores: Store[] }) {
  return (
    <ActionForm action={saveLink} className="grid gap-3 sm:grid-cols-[1fr_160px]">
      {l && <input type="hidden" name="id" value={l.id} />}
      <Field label="Nombre interno"><input name="label" defaultValue={l?.label} className="field" required /></Field>
      <Field label="Tienda">
        <select name="storeId" defaultValue={l?.storeId ?? ""} className="field" required>
          <option value="" disabled>Elige…</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <Field label="URL de destino (sin código de afiliado: se añade automáticamente)" className="sm:col-span-2"><input name="targetUrl" defaultValue={l?.targetUrl} className="field font-mono text-[12px]" required /></Field>
      <div className="flex flex-wrap items-center gap-5 text-[13px]">
        <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={l?.active ?? true} className="size-4 accent-ink" /> Activo</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="applyAffiliate" defaultChecked={l?.applyAffiliate ?? true} className="size-4 accent-ink" /> Aplicar código de afiliado de la tienda</label>
      </div>
      <div className="sm:text-right"><SubmitButton variant={l ? "secondary" : "primary"}>{l ? "Guardar" : "Crear enlace"}</SubmitButton></div>
    </ActionForm>
  );
}

export default async function LinksAdmin() {
  await requireUser();
  const [links, stores, clicks] = await Promise.all([db().list("links"), db().list("stores"), clickStats(30)]);
  const storeById = new Map(stores.map((s) => [s.id, s]));
  return (
    <AdminPage
      title="Enlaces de compra"
      description="Todos los botones de compra pasan por /go/[id] (rel=&quot;sponsored&quot;). Así puedes cambiar destinos o códigos de afiliado sin tocar el contenido. Los clics son contadores internos reales."
    >
      <Panel title="Nuevo enlace" className="mb-6"><LinkForm stores={stores} /></Panel>
      <div className="space-y-3">
        {links.sort((a, b) => (clicks.totals.get(b.id) ?? 0) - (clicks.totals.get(a.id) ?? 0)).map((l) => {
          let finalUrl = "";
          try { finalUrl = buildOutboundUrl(l, storeById.get(l.storeId) ?? null); } catch { finalUrl = "URL no válida"; }
          return (
            <details key={l.id} className="rounded-md border border-line bg-paper">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-5 py-3.5">
                <span className="text-[14px] font-medium">{l.label}</span>
                <span className="font-mono text-[11px] text-muted">/go/{l.id} · {clicks.totals.get(l.id) ?? 0} clics totales · {clicks.perItem.get(l.id) ?? 0} en 30 días {l.active ? "" : "· INACTIVO"}</span>
              </summary>
              <div className="border-t border-line p-5">
                <LinkForm l={l} stores={stores} />
                <p className="mt-3 break-all font-mono text-[11px] text-muted">Destino final: {finalUrl}</p>
              </div>
            </details>
          );
        })}
      </div>
    </AdminPage>
  );
}
