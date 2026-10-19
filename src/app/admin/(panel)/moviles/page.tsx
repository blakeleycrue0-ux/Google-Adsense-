import Link from "next/link";
import { AdminPage, Table } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { lowestOffer } from "@/lib/phones";

export default async function PhonesAdmin() {
  await requireUser();
  const phones = (await db().list("phones")).sort((a, b) => `${a.brand}${a.model}`.localeCompare(`${b.brand}${b.model}`));
  return (
    <AdminPage title="Fichas de móviles" description="Especificaciones, ventajas, inconvenientes, alternativas y precios por tienda." actions={<Link href="/admin/moviles/nuevo" className="btn-primary">Nueva ficha</Link>}>
      <Table>
        <thead><tr><th>Modelo</th><th>Especificaciones</th><th>Precio más bajo</th><th>Actualizada</th></tr></thead>
        <tbody>
          {phones.map((p) => {
            const o = lowestOffer(p);
            const demo = p.offers.some((x) => x.source === "demo");
            return (
              <tr key={p.id}>
                <td><Link href={`/admin/moviles/${p.id}`} className="font-medium hover:underline">{p.brand} {p.model}</Link></td>
                <td>{p.specsVerified ? <span className="text-[12px] text-ok">Verificadas</span> : <span className="text-[12px] text-warn">Sin verificar</span>}</td>
                <td>{o ? formatPrice(o.price) : "—"} {demo && <span className="ml-1 font-mono text-[10px] uppercase text-warn">demo</span>}</td>
                <td className="text-[13px] text-muted">{formatDate(p.updatedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </AdminPage>
  );
}
