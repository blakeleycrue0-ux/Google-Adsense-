import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/forms";
import { PostEditor } from "@/components/admin/PostEditor";
import { AdminPage } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { isPublished } from "@/lib/content";
import { db } from "@/lib/db";
import { deletePost } from "../actions";

export default async function EditPost({ params, searchParams }: PageProps<"/admin/articulos/[id]">) {
  await requireUser();
  const { id } = await params;
  const aviso = (await searchParams).aviso;
  const [post, categories, authors, media] = await Promise.all([db().get("posts", id), db().list("categories"), db().list("authors"), db().list("media")]);
  if (!post) notFound();
  return (
    <AdminPage
      title="Editar artículo"
      back={{ href: "/admin/articulos", label: "Artículos" }}
      actions={
        <>
          {isPublished(post) && (
            <Link href={`/noticias/${post.slug}`} target="_blank" className="btn-secondary btn-sm">
              Ver en la web ↗
            </Link>
          )}
          <form action={deletePost}>
            <input type="hidden" name="id" value={post.id} />
            <ConfirmButton message="¿Eliminar este artículo definitivamente?">Eliminar</ConfirmButton>
          </form>
        </>
      }
    >
      {typeof aviso === "string" && (
        <p className="mb-6 rounded-sm border border-warn px-4 py-3 text-[13px] text-warn">No se pudo usar el asistente de IA: {aviso}. Se ha creado un borrador con la plantilla estándar.</p>
      )}
      {post.isDemo && (
        <p className="mb-6 rounded-sm border border-dashed border-line-strong bg-paper px-4 py-3 text-[13px] text-muted">
          Artículo de demostración: revísalo, verifica las fuentes y sustituye la ilustración antes de lanzar el sitio, o elimínalo.
        </p>
      )}
      <PostEditor post={post} categories={categories.sort((a, b) => a.order - b.order)} authors={authors} library={media.map((m) => ({ url: m.url, alt: m.alt }))} />
    </AdminPage>
  );
}
