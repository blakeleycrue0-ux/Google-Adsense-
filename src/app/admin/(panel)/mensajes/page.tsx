import { ConfirmButton } from "@/components/admin/forms";
import { AdminPage, Empty } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { deleteMessage, toggleRead } from "./actions";

export default async function MessagesPage() {
  await requireUser();
  const messages = (await db().list("messages")).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <AdminPage title="Mensajes" description="Recibidos desde el formulario de contacto. Contienen datos personales: trátalos según la política de privacidad.">
      {messages.length === 0 ? (
        <Empty title="No hay mensajes" />
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className={`rounded-md border bg-paper p-5 ${m.read ? "border-line" : "border-ink"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{m.subject}</p>
                  <p className="text-[13px] text-muted">
                    {m.name} · <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="underline">{m.email}</a> · {formatDateTime(m.createdAt)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <form action={toggleRead}><input type="hidden" name="id" value={m.id} /><button className="btn-ghost btn-sm">{m.read ? "Marcar no leído" : "Marcar leído"}</button></form>
                  <form action={deleteMessage}><input type="hidden" name="id" value={m.id} /><ConfirmButton>Eliminar</ConfirmButton></form>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  );
}
