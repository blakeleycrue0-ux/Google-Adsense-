import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { AdminPage, Field, Panel } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Store } from "@/lib/types";
import { saveStore } from "./actions";

function StoreForm({ s }: { s?: Store }) {
  return (
    <ActionForm action={saveStore} className="grid gap-3 sm:grid-cols-3">
      {s && <input type="hidden" name="id" value={s.id} />}
      <Field label="Tienda"><input name="name" defaultValue={s?.name} className="field" required /></Field>
      <Field label="Dominio"><input name="domain" defaultValue={s?.domain} className="field" /></Field>
      <Field label="Programa de afiliación"><input name="program" defaultValue={s?.affiliate?.program} className="field" placeholder="Amazon Afiliados" /></Field>
      <Field label="Parámetro de URL" hint="Amazon: «tag». Otros programas: consulta su documentación."><input name="param" defaultValue={s?.affiliate?.param} className="field font-mono text-[12px]" /></Field>
      <Field label="Tu identificador" hint="Disponible cuando la cuenta esté aprobada."><input name="value" defaultValue={s?.affiliate?.value} className="field font-mono text-[12px]" placeholder="tuweb-21" /></Field>
      <div className="flex items-end justify-between gap-3">
        <label className="flex items-center gap-2 pb-2 text-[13px]"><input type="checkbox" name="enabled" defaultChecked={s?.affiliate?.enabled} className="size-4 accent-ink" /> Programa activo</label>
        <SubmitButton variant={s ? "secondary" : "primary"}>{s ? "Guardar" : "Añadir"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export default async function StoresAdmin() {
  await requireUser("admin");
  const stores = await db().list("stores");
  return (
    <AdminPage
      title="Tiendas y afiliados"
      description="Activa cada programa solo cuando tu cuenta esté aprobada. Mientras esté inactivo, los enlaces llevan a la tienda sin código de afiliado. Algunos programas (p. ej. PcComponentes vía su red de afiliación) usan enlaces generados por la plataforma: en ese caso pega el enlace completo en «Enlaces de compra» y desactiva «Aplicar código»."
    >
      <Panel title="Nueva tienda" className="mb-6"><StoreForm /></Panel>
      <div className="space-y-3">
        {stores.map((s) => (
          <Panel key={s.id}>
            <p className="mb-3 text-[12px] text-muted">{s.affiliate?.enabled ? `✓ ${s.affiliate.program} activo (${s.affiliate.param}=${s.affiliate.value})` : "Sin programa de afiliación activo"}</p>
            <StoreForm s={s} />
          </Panel>
        ))}
      </div>
    </AdminPage>
  );
}
