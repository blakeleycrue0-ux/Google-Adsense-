import Link from "next/link";
import { AdminPage, Table } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function LegalPagesAdmin() {
  await requireUser();
  const pages = await db().list("legal");
  return (
    <AdminPage title="Páginas legales" description="Textos editables. Los marcadores {{titular}}, {{nif}}, {{direccion}}, {{registro}}, {{email}}, {{sitio}} y {{programas}} se rellenan desde Ajustes.">
      <Table>
        <thead><tr><th>Página</th><th>Estado</th><th>Actualizada</th></tr></thead>
        <tbody>
          {pages.map((p) => (
            <tr key={p.id}>
              <td><Link href={`/admin/paginas/${p.id}`} className="font-medium hover:underline">{p.title}</Link> <span className="ml-1 font-mono text-[11px] text-muted">/legal/{p.slug}</span></td>
              <td>{p.needsLegalReview ? <span className="text-[12px] text-warn">Pendiente de revisión legal</span> : <span className="text-[12px] text-ok">Revisada</span>}</td>
              <td className="text-[13px] text-muted">{formatDate(p.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </AdminPage>
  );
}
