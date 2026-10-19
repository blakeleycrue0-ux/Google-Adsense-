import { PostEditor } from "@/components/admin/PostEditor";
import { AdminPage } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function NewPost() {
  await requireUser();
  const [categories, authors] = await Promise.all([db().list("categories"), db().list("authors")]);
  return (
    <AdminPage title="Nuevo artículo" back={{ href: "/admin/articulos", label: "Artículos" }}>
      <PostEditor categories={categories.sort((a, b) => a.order - b.order)} authors={authors} image={{ state: "pending" }} />
    </AdminPage>
  );
}
