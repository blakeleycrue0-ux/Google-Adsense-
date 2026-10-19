import { ActionForm, ConfirmButton, SubmitButton } from "@/components/admin/forms";
import { AdminPage, Field, Panel } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Category } from "@/lib/types";
import { deleteCategory, saveCategory } from "./actions";

function CategoryForm({ c }: { c?: Category }) {
  return (
    <ActionForm action={saveCategory} className="grid gap-3 sm:grid-cols-[1fr_1fr_80px_80px]">
      {c && <input type="hidden" name="id" value={c.id} />}
      <Field label="Nombre"><input name="name" defaultValue={c?.name} className="field" required /></Field>
      <Field label="Slug (URL)"><input name="slug" defaultValue={c?.slug} className="field font-mono text-[12px]" /></Field>
      <Field label="Emoji"><input name="emoji" defaultValue={c?.emoji} className="field" /></Field>
      <Field label="Orden"><input name="order" type="number" defaultValue={c?.order ?? 10} className="field" /></Field>
      <Field label="Descripción" className="sm:col-span-3"><input name="description" defaultValue={c?.description} className="field" /></Field>
      <div className="flex items-end"><SubmitButton variant={c ? "secondary" : "primary"} className="w-full">{c ? "Guardar" : "Crear"}</SubmitButton></div>
    </ActionForm>
  );
}

export default async function CategoriesPage() {
  await requireUser();
  const [cats, posts] = await Promise.all([db().list("categories"), db().list("posts")]);
  return (
    <AdminPage title="Categorías" description="Secciones del medio. Cada una tiene su página pública en /categoria/slug.">
      <Panel title="Nueva categoría" className="mb-6"><CategoryForm /></Panel>
      <div className="space-y-3">
        {cats.sort((a, b) => a.order - b.order).map((c) => (
          <Panel key={c.id}>
            <p className="mb-3 text-[12px] text-muted">{posts.filter((p) => p.categoryId === c.id).length} artículos</p>
            <CategoryForm c={c} />
            <ActionForm action={deleteCategory} className="mt-3 border-t border-line pt-3">
              <input type="hidden" name="id" value={c.id} />
              <ConfirmButton>Eliminar categoría</ConfirmButton>
            </ActionForm>
          </Panel>
        ))}
      </div>
    </AdminPage>
  );
}
