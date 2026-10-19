import { ActionForm, ConfirmButton, SubmitButton } from "@/components/admin/forms";
import { AdminPage, Field, Panel } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Guide, Phone } from "@/lib/types";
import { deleteGuide, saveGuide } from "./actions";

function GuideForm({ g, phones }: { g?: Guide; phones: Phone[] }) {
  return (
    <ActionForm action={saveGuide} className="grid gap-4 sm:grid-cols-4">
      {g && <input type="hidden" name="id" value={g.id} />}
      <Field label="Título" className="sm:col-span-2"><input name="title" defaultValue={g?.title} className="field" required /></Field>
      <Field label="Emoji"><input name="emoji" defaultValue={g?.emoji} className="field" /></Field>
      <Field label="Orden"><input name="order" type="number" defaultValue={g?.order ?? 10} className="field" /></Field>
      <Field label="Slug"><input name="slug" defaultValue={g?.slug} className="field font-mono text-[12px]" /></Field>
      <Field label="Precio mínimo (€)"><input name="minPrice" type="number" defaultValue={g?.minPrice} className="field" /></Field>
      <Field label="Precio máximo (€)"><input name="maxPrice" type="number" defaultValue={g?.maxPrice} className="field" /></Field>
      <div />
      <Field label="Introducción" className="sm:col-span-4"><textarea name="intro" defaultValue={g?.intro} rows={2} className="field" /></Field>
      <Field label="Texto de la guía (Markdown)" className="sm:col-span-4"><textarea name="body" defaultValue={g?.body} rows={8} className="field font-mono text-[13px]" /></Field>
      <fieldset className="sm:col-span-4">
        <legend className="label">Móviles incluidos (en el orden de la lista)</legend>
        <div className="grid gap-1.5 sm:grid-cols-3">
          {phones.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" name="phoneIds" value={p.id} defaultChecked={g?.phoneIds.includes(p.id)} className="size-4 accent-ink" /> {p.brand} {p.model}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="sm:col-span-4"><SubmitButton>{g ? "Guardar guía" : "Crear guía"}</SubmitButton></div>
    </ActionForm>
  );
}

export default async function GuidesAdmin() {
  await requireUser();
  const [guides, phones] = await Promise.all([db().list("guides"), db().list("phones")]);
  return (
    <AdminPage title="Guías de compra" description="Selecciones editoriales por presupuesto. Se muestran en la portada y en /comparativas.">
      <details className="mb-6 rounded-md border border-line bg-paper">
        <summary className="cursor-pointer px-5 py-4 font-medium">+ Nueva guía</summary>
        <div className="border-t border-line p-5"><GuideForm phones={phones} /></div>
      </details>
      <div className="space-y-3">
        {guides.sort((a, b) => a.order - b.order).map((g) => (
          <details key={g.id} className="rounded-md border border-line bg-paper">
            <summary className="cursor-pointer px-5 py-4"><span className="font-medium">{g.emoji} {g.title}</span> <span className="text-[12px] text-muted">· {g.phoneIds.length} móviles</span></summary>
            <div className="border-t border-line p-5">
              <GuideForm g={g} phones={phones} />
              <ActionForm action={deleteGuide} className="mt-3 border-t border-line pt-3">
                <input type="hidden" name="id" value={g.id} />
                <ConfirmButton>Eliminar guía</ConfirmButton>
              </ActionForm>
            </div>
          </details>
        ))}
      </div>
      <Panel className="mt-6"><p className="text-[13px] text-muted">Consejo: explica en el texto por qué incluyes cada modelo. Las guías con criterio propio aportan valor y son mejor recibidas por Google y por los lectores.</p></Panel>
    </AdminPage>
  );
}
