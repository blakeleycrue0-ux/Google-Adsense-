import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { AdminPage, Field, Panel } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveLegalPage } from "../actions";

export default async function EditLegal({ params }: PageProps<"/admin/paginas/[id]">) {
  await requireUser();
  const page = await db().get("legal", (await params).id);
  if (!page) notFound();
  return (
    <AdminPage
      title={page.title}
      back={{ href: "/admin/paginas", label: "Páginas legales" }}
      actions={<Link href={`/legal/${page.slug}`} target="_blank" className="btn-secondary btn-sm">Ver en la web ↗</Link>}
    >
      <Panel>
        <ActionForm action={saveLegalPage} className="space-y-4">
          <input type="hidden" name="id" value={page.id} />
          <Field label="Título"><input name="title" defaultValue={page.title} className="field" /></Field>
          <Field label="Contenido (Markdown)"><textarea name="body" defaultValue={page.body} rows={26} className="field font-mono text-[13px]" /></Field>
          <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" name="needsLegalReview" defaultChecked={page.needsLegalReview} className="size-4 accent-ink" /> Pendiente de revisión legal (muestra un aviso en la página pública)</label>
          <SubmitButton>Guardar</SubmitButton>
        </ActionForm>
      </Panel>
    </AdminPage>
  );
}
