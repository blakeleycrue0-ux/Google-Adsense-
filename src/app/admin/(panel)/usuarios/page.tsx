import { ActionForm, ConfirmButton, SubmitButton } from "@/components/admin/forms";
import { AdminPage, Field, Panel } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { User } from "@/lib/types";
import { deleteUser, saveUser } from "./actions";

function UserForm({ u }: { u?: User }) {
  return (
    <ActionForm action={saveUser} className="grid gap-3 sm:grid-cols-[1fr_1fr_140px_1fr_auto] sm:items-end">
      {u && <input type="hidden" name="id" value={u.id} />}
      <Field label="Nombre"><input name="name" defaultValue={u?.name} className="field" required /></Field>
      <Field label="Correo"><input name="email" type="email" defaultValue={u?.email} className="field" required /></Field>
      <Field label="Rol">
        <select name="role" defaultValue={u?.role ?? "editor"} className="field"><option value="editor">Edición</option><option value="admin">Administración</option></select>
      </Field>
      <Field label={u ? "Nueva contraseña (opcional)" : "Contraseña (mín. 12)"}><input name="password" type="password" autoComplete="new-password" className="field" /></Field>
      <SubmitButton variant={u ? "secondary" : "primary"}>{u ? "Guardar" : "Crear"}</SubmitButton>
    </ActionForm>
  );
}

export default async function UsersPage() {
  const me = await requireUser("admin");
  const users = await db().list("users");
  return (
    <AdminPage title="Usuarios" description="Edición: gestiona contenido, móviles, ofertas y enlaces. Administración: además, ajustes, publicidad, tiendas y usuarios.">
      <Panel title="Nuevo usuario" className="mb-6"><UserForm /></Panel>
      <div className="space-y-3">
        {users.map((u) => (
          <Panel key={u.id}>
            <UserForm u={u} />
            {u.id !== me.id && (
              <ActionForm action={deleteUser} className="mt-3 border-t border-line pt-3">
                <input type="hidden" name="id" value={u.id} />
                <ConfirmButton>Eliminar usuario</ConfirmButton>
              </ActionForm>
            )}
          </Panel>
        ))}
      </div>
    </AdminPage>
  );
}
