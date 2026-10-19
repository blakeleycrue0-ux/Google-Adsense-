import { PostEditor } from "@/components/admin/PostEditor";
import { AdminPage } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function NewPost() {
  await requireUser();
  const [categories, authors, media] = await Promise.all([db().list("categories"), db().list("authors"), db().list("media")]);
  return (
    <AdminPage title="Nuevo artículo" back={{ href: "/admin/articulos", label: "Artículos" }}>
      <PostEditor categories={categories.sort((a, b) => a.order - b.order)} authors={authors} library={media.map((m) => ({ url: m.url, alt: m.alt }))} />
    </AdminPage>
  );
}
