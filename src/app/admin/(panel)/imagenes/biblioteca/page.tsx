import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { AdminPage, Empty, Table } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { catalogDevices, isRenderable, SLOTS } from "@/lib/devices";
import type { Device, ImageRef } from "@/lib/types";
import { importCatalogAction } from "./actions";

/** Estado de una vista: aprobada, propuesta (subida sin aprobar) o sin foto. */
function slotState(ref: ImageRef | undefined) {
  if (isRenderable(ref)) return "approved" as const;
  if (ref?.src) return "proposed" as const;
  return "missing" as const;
}

const STATE_UI = {
  approved: ["✓", "bg-ink text-paper", "Aprobada"],
  proposed: ["•", "border border-ink text-ink", "Propuesta sin aprobar"],
  missing: ["–", "bg-surface text-faint", "Sin foto"],
} as const;

const FILTERS = [
  { id: "", label: "Todos" },
  { id: "sin-portada", label: "Sin portada aprobada" },
  { id: "por-aprobar", label: "Con fotos por aprobar" },
  { id: "con-portada", label: "Con portada aprobada" },
] as const;

export default async function DeviceLibrary({ searchParams }: PageProps<"/admin/imagenes/biblioteca">) {
  await requireUser();
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const [devices, phones] = await Promise.all([db().list("devices"), db().list("phones")]);
  const phoneByDevice = new Map(phones.filter((p) => p.deviceId).map((p) => [p.deviceId!, p]));
  const fullCatalog = catalogDevices(2).length;

  const brand = get("marca");
  const year = Number(get("año")) || 0;
  const q = get("q").toLowerCase();
  const estado = get("estado");
  const fase = Number(get("fase")) || 0;

  const has = (d: Device, s: "approved" | "proposed") => SLOTS.some(({ id }) => slotState(d.photos[id]) === s);
  const list = devices
    .filter((d) => !brand || d.brand === brand)
    .filter((d) => !year || d.year === year)
    .filter((d) => !fase || d.phase === fase)
    .filter((d) => !q || `${d.brand} ${d.model}`.toLowerCase().includes(q))
    .filter((d) =>
      estado === "sin-portada" ? slotState(d.photos.main) !== "approved" : estado === "por-aprobar" ? has(d, "proposed") : estado === "con-portada" ? slotState(d.photos.main) === "approved" : true,
    )
    .sort((a, b) => a.phase - b.phase || a.brand.localeCompare(b.brand) || b.year - a.year || a.model.localeCompare(b.model));

  const all = devices.flatMap((d) => SLOTS.map(({ id }) => slotState(d.photos[id])));
  const stats = [
    { label: "Móviles importados", value: `${devices.length} / ${fullCatalog}` },
    { label: "Fotos reales subidas", value: all.filter((s) => s !== "missing").length },
    { label: "Fotos aprobadas", value: all.filter((s) => s === "approved").length },
    { label: "Sin portada aprobada", value: devices.filter((d) => slotState(d.photos.main) !== "approved").length },
  ];
  const brands = [...new Set(devices.map((d) => d.brand))].sort();
  const years = [...new Set(devices.map((d) => d.year))].sort((a, b) => b - a);

  return (
    <AdminPage
      title="Biblioteca de móviles"
      back={{ href: "/admin/imagenes", label: "Imágenes" }}
      description="Catálogo cerrado de móviles con tres vistas (portada, frontal y trasera). Cada foto se sube o importa una sola vez, se aprueba a mano y se reutiliza en fichas, guías y comparativas. Solo se muestran en la web las fotos aprobadas con licencia completa."
      actions={
        <>
          <ActionForm action={importCatalogAction}>
            <input type="hidden" name="phase" value="1" />
            <SubmitButton variant="secondary">Importar fase 1 (54)</SubmitButton>
          </ActionForm>
          <ActionForm action={importCatalogAction}>
            <input type="hidden" name="phase" value="2" />
            <SubmitButton variant="secondary">Ampliar a los 99</SubmitButton>
          </ActionForm>
        </>
      }
    >
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-md border border-line bg-paper px-4 py-3">
            <dt className="text-[12px] text-muted">{s.label}</dt>
            <dd className="mt-0.5 text-[22px] font-semibold tabular-nums tracking-[-0.02em]">{s.value}</dd>
          </div>
        ))}
      </dl>

      <form className="mt-6 flex flex-wrap items-end gap-3" method="get">
        <label className="block">
          <span className="label">Marca</span>
          <select name="marca" defaultValue={brand} className="field">
            <option value="">Todas</option>
            {brands.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Año</span>
          <select name="año" defaultValue={year || ""} className="field">
            <option value="">Todos</option>
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Fase</span>
          <select name="fase" defaultValue={fase || ""} className="field">
            <option value="">Todas</option>
            <option value="1">1 · prioritarios</option>
            <option value="2">2 · ampliación</option>
          </select>
        </label>
        <label className="block">
          <span className="label">Fotos</span>
          <select name="estado" defaultValue={estado} className="field">
            {FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-[180px] flex-1">
          <span className="label">Modelo</span>
          <input name="q" defaultValue={get("q")} className="field" placeholder="Galaxy S24, Pixel 9…" />
        </label>
        <button className="btn-secondary">Filtrar</button>
      </form>

      <div className="mt-6">
        {devices.length === 0 ? (
          <Empty title="La biblioteca está vacía">Pulsa «Importar fase 1 (54)» para cargar los móviles prioritarios.</Empty>
        ) : list.length === 0 ? (
          <Empty title="Ningún móvil coincide con los filtros" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Móvil</th>
                <th>Año</th>
                <th>Fotos</th>
                <th>Ficha</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => {
                const phone = phoneByDevice.get(d.id);
                const preview = d.photos.main?.src;
                return (
                  <tr key={d.id}>
                    <td>
                      <Link href={`/admin/imagenes/biblioteca/${d.id}`} className="flex items-center gap-3 font-medium hover:underline">
                        <span className="relative grid h-11 w-9 shrink-0 place-items-center overflow-hidden rounded-xs bg-surface text-[10px] text-faint">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {preview ? <img src={preview} alt="" className="h-full w-full object-contain" loading="lazy" /> : "—"}
                        </span>
                        <span>
                          {d.brand} {d.model}
                          <span className="block font-mono text-[11px] font-normal text-faint">{d.id}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="tabular-nums text-muted">{d.year}</td>
                    <td>
                      <span className="flex gap-1.5">
                        {SLOTS.map(({ id, label }) => {
                          const [mark, cls, desc] = STATE_UI[slotState(d.photos[id])];
                          return (
                            <span key={id} title={`${label}: ${desc}`} className={`inline-flex h-5 items-center gap-1 rounded-xs px-1.5 text-[11px] font-medium ${cls}`}>
                              {mark} {label}
                            </span>
                          );
                        })}
                      </span>
                    </td>
                    <td className="text-[13px]">
                      {phone ? (
                        <Link href={`/admin/moviles/${phone.id}`} className="underline underline-offset-2">
                          Editar ficha
                        </Link>
                      ) : (
                        <span className="text-faint">Sin ficha</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>
    </AdminPage>
  );
}
