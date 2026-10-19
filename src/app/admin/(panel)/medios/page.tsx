import { ActionForm, ConfirmButton, SubmitButton } from "@/components/admin/forms";
import { AdminPage, Empty, Field, Panel } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { deleteMedia, updateMediaAlt, uploadMedia } from "./actions";

export default async function MediaPage() {
  await requireUser();
  const [media, posts] = await Promise.all([db().list("media"), db().list("posts")]);
  const used = (url: string) => posts.some((p) => p.cover.src === url || p.body.includes(url));
  return (
    <AdminPage title="Imágenes" description="Las imágenes se convierten a WebP y se limitan a 2000 px. Sube solo imágenes propias o con licencia de uso.">
      <Panel title="Subir imagen" className="mb-6">
        <ActionForm action={uploadMedia} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Archivo (JPG, PNG, WebP, AVIF, GIF · máx. 8 MB)">
            <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" required className="field py-1.5 text-[13px]" />
          </Field>
          <Field label="Texto alternativo"><input name="alt" className="field" placeholder="Describe la imagen" /></Field>
          <SubmitButton>Subir</SubmitButton>
        </ActionForm>
      </Panel>
      {media.length === 0 ? (
        <Empty title="Aún no hay imágenes subidas" />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {media.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)).map((m) => (
            <li key={m.id} className="overflow-hidden rounded-md border border-line bg-paper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.alt} className="aspect-[16/10] w-full bg-surface object-cover" loading="lazy" />
              <div className="space-y-2 p-3">
                <p className="truncate font-mono text-[11px] text-muted" title={m.url}>{m.url}</p>
                <p className="text-[12px] text-muted">{m.width}×{m.height} · {Math.round(m.size / 1024)} KB · {formatDate(m.uploadedAt)}</p>
                <ActionForm action={updateMediaAlt} className="flex gap-2">
                  <input type="hidden" name="id" value={m.id} />
                  <input name="alt" defaultValue={m.alt} placeholder="Texto alternativo" className="field h-8 text-[13px]" />
                  <SubmitButton variant="secondary" className="btn-sm">OK</SubmitButton>
                </ActionForm>
                {used(m.url) ? (
                  <p className="text-[12px] text-muted">En uso en algún artículo</p>
                ) : (
                  <form action={deleteMedia}>
                    <input type="hidden" name="id" value={m.id} />
                    <ConfirmButton>Eliminar</ConfirmButton>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  );
}
