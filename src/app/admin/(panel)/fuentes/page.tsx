import { ActionForm, ConfirmButton, SubmitButton } from "@/components/admin/forms";
import { AdminPage, Field, Panel } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatSmart } from "@/lib/format";
import type { Category, NewsSource } from "@/lib/types";
import { runIngest } from "../deteccion/actions";
import { deleteSource, saveSource } from "./actions";

function SourceForm({ source, categories }: { source?: NewsSource; categories: Category[] }) {
  return (
    <ActionForm action={saveSource} className="grid gap-4 sm:grid-cols-2">
      {source && <input type="hidden" name="id" value={source.id} />}
      <Field label="Nombre"><input name="name" defaultValue={source?.name} className="field" required /></Field>
      <Field label="URL del feed (RSS/Atom)"><input name="feedUrl" defaultValue={source?.feedUrl} className="field font-mono text-[12px]" required /></Field>
      <Field label="Web de la fuente"><input name="siteUrl" defaultValue={source?.siteUrl} className="field font-mono text-[12px]" required /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Idioma"><input name="language" defaultValue={source?.language ?? "es"} className="field" /></Field>
        <Field label="Categoría por defecto">
          <select name="defaultCategoryId" defaultValue={source?.defaultCategoryId ?? ""} className="field">
            <option value="">Automática</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      </div>
      <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" name="active" defaultChecked={source?.active} className="size-4 accent-ink" /> Activa (se consulta en cada detección)</label>
      <div className="space-y-2 rounded-sm border border-line p-3 text-[13px] sm:col-span-2">
        <label className="flex items-start gap-2">
          <input type="checkbox" name="imagesReusable" defaultChecked={source?.imagesReusable} className="mt-0.5 size-4 accent-ink" />
          <span>La fuente autoriza reutilizar las imágenes de su feed (p. ej. sala de prensa con condiciones de uso verificadas). Si no, sus imágenes nunca se copian.</span>
        </label>
        <input name="imagePermissionNote" defaultValue={source?.imagePermissionNote} placeholder="Dónde consta el permiso (URL de las condiciones, acuerdo…)" className="field h-8 text-[12px]" />
      </div>
      <div className="sm:text-right"><SubmitButton variant={source ? "secondary" : "primary"}>{source ? "Guardar" : "Añadir fuente"}</SubmitButton></div>
    </ActionForm>
  );
}

export default async function SourcesPage() {
  await requireUser();
  const [sources, categories] = await Promise.all([db().list("sources"), db().list("categories")]);
  return (
    <AdminPage
      title="Fuentes"
      description="Feeds RSS/Atom autorizados. Antes de activar una fuente, revisa sus condiciones de uso: solo se guardan titular, enlace y extracto para revisión interna."
    >
      <Panel title="Añadir fuente" className="mb-6"><SourceForm categories={categories} /></Panel>
      <div className="space-y-4">
        {sources.map((s) => (
          <details key={s.id} className="group rounded-md border border-line bg-paper">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4">
              <span>
                <span className="font-medium">{s.name}</span>
                <span className={`ml-2 rounded-xs px-1.5 py-0.5 text-[11px] ${s.active ? "bg-ink text-paper" : "bg-surface text-muted"}`}>{s.active ? "Activa" : "Inactiva"}</span>
                <span className="mt-0.5 block font-mono text-[11px] text-muted">{s.feedUrl}</span>
              </span>
              <span className="text-[12px] text-muted">
                {s.lastFetchedAt ? `Última consulta: ${formatSmart(s.lastFetchedAt)} · ${s.lastItemCount ?? 0} elementos` : "Nunca consultada"}
                {s.lastError && <span className="ml-2 text-live">Error: {s.lastError}</span>}
              </span>
            </summary>
            <div className="border-t border-line p-5">
              <SourceForm source={s} categories={categories} />
              <div className="mt-4 flex gap-2 border-t border-line pt-4">
                <ActionForm action={runIngest}>
                  <input type="hidden" name="sourceId" value={s.id} />
                  <SubmitButton variant="secondary">Probar ahora</SubmitButton>
                </ActionForm>
                <form action={deleteSource}>
                  <input type="hidden" name="id" value={s.id} />
                  <ConfirmButton>Eliminar</ConfirmButton>
                </form>
              </div>
            </div>
          </details>
        ))}
      </div>
    </AdminPage>
  );
}
