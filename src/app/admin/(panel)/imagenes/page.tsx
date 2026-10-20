import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { AdminPage, Empty, Panel } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { withLibraryPhoto } from "@/lib/devices";
import { providerInfo } from "@/lib/images/providers";
import { bestCandidate, imageState, searchId, type ImageState } from "@/lib/images/search";
import { formatSmart } from "@/lib/format";
import type { ImageRef, ImageSearch } from "@/lib/types";
import { runAutoPropose, testProviders } from "./actions";

const TABS: { id: ImageState | "detectadas"; label: string }[] = [
  { id: "pending", label: "Pendientes" },
  { id: "proposed", label: "Con propuesta" },
  { id: "approved", label: "Aprobadas" },
  { id: "detectadas", label: "Noticias detectadas" },
];

type Row = { key: string; type: "post" | "phone"; id: string; title: string; kind: string; image: ImageRef; state: ImageState; search?: ImageSearch; deviceId?: string };

export default async function ImagesAdmin({ searchParams }: PageProps<"/admin/imagenes">) {
  await requireUser();
  const sp = await searchParams;
  const tab = (typeof sp.vista === "string" ? sp.vista : "pending") as (typeof TABS)[number]["id"];
  const [posts, rawPhones, detected, searches, devices] = await Promise.all([db().list("posts"), db().list("phones"), db().list("detected"), db().list("imageSearches"), db().list("devices")]);
  // La portada aprobada en la biblioteca de móviles cuenta como imagen de la ficha.
  const deviceById = new Map(devices.map((d) => [d.id, d]));
  const phones = rawPhones.map((p) => withLibraryPhoto(p, p.deviceId ? deviceById.get(p.deviceId) : undefined));
  const byId = new Map(searches.map((s) => [s.id, s]));

  const rows: Row[] = [
    ...posts.map((p) => {
      const search = byId.get(searchId("post", p.id));
      return { key: `post:${p.id}`, type: "post" as const, id: p.id, title: p.title, kind: p.status === "published" ? "Artículo publicado" : "Artículo (borrador)", image: p.cover, state: imageState(p.cover, search), search };
    }),
    ...phones.map((p) => {
      const search = byId.get(searchId("phone", p.id));
      return { key: `phone:${p.id}`, type: "phone" as const, id: p.id, title: `${p.brand} ${p.model}`, kind: "Ficha de móvil", image: p.image, state: imageState(p.image, search), search, deviceId: p.deviceId };
    }),
  ];
  const counts = { pending: 0, proposed: 0, approved: 0 } as Record<ImageState, number>;
  rows.forEach((r) => counts[r.state]++);
  const providers = providerInfo();
  const detectedRows = detected
    .filter((d) => d.status === "new" && !d.duplicateOf)
    .map((d) => ({ d, search: byId.get(searchId("detected", d.id)) }))
    .sort((a, b) => b.d.detectedAt.localeCompare(a.d.detectedAt))
    .slice(0, 60);
  const list = rows.filter((r) => r.state === tab);

  return (
    <AdminPage
      title="Imágenes"
      description="Fotografías con licencia verificada para artículos y fichas. El sistema propone imágenes automáticamente; ninguna se publica sin tu aprobación."
      actions={
        <>
          <ActionForm action={runAutoPropose}>
            <SubmitButton>Buscar propuestas ahora</SubmitButton>
          </ActionForm>
          <Link href="/admin/imagenes/biblioteca" className="btn-secondary">Biblioteca de móviles</Link>
          <Link href="/admin/medios" className="btn-secondary">Medios</Link>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {(["pending", "proposed", "approved"] as ImageState[]).map((s) => (
          <Link key={s} href={`/admin/imagenes?vista=${s}`} className="rounded-md border border-line bg-paper p-5 transition-colors hover:border-ink">
            <p className="text-[13px] text-muted">{TABS.find((t) => t.id === s)!.label}</p>
            <p className="mt-2 text-[32px] font-semibold leading-none tracking-[-0.04em] tabular-nums">{counts[s]}</p>
          </Link>
        ))}
      </div>

      <Panel title="Fuentes de imágenes" description="Solo se consultan proveedores con licencias compatibles. Las claves se configuran en variables de entorno." className="mt-6">
        <ul className="grid gap-3 sm:grid-cols-2">
          {providers.map((p) => (
            <li key={p.id} className="rounded-sm border border-line p-3 text-[13px]">
              <p className="flex items-center justify-between gap-2">
                <span className="font-medium">{p.name}</span>
                <span className={`rounded-xs px-1.5 py-0.5 text-[11px] ${p.configured ? "bg-ink text-paper" : "bg-surface text-muted"}`}>
                  {p.configured ? "Configurado" : `Falta ${p.needs}`}
                </span>
              </p>
              <p className="mt-1 text-muted">{p.notes}</p>
            </li>
          ))}
          <li className="rounded-sm border border-dashed border-line-strong p-3 text-[13px] text-muted sm:col-span-2">
            <span className="font-medium text-ink">Imágenes oficiales y de tiendas.</span> Las fotografías de prensa de los fabricantes y las de programas de afiliación se añaden desde la ficha de cada contenido («Imagen por URL»), indicando el permiso o las condiciones. Los feeds RSS solo aportan imagen si marcas la fuente como autorizada.
          </li>
        </ul>
        <ActionForm action={testProviders} className="mt-4">
          <SubmitButton variant="secondary">Comprobar conexión</SubmitButton>
        </ActionForm>
      </Panel>

      <div className="mb-5 mt-8 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/imagenes?vista=${t.id}`}
            aria-current={tab === t.id ? "page" : undefined}
            className="h-8 rounded-sm px-3 text-[13px] leading-8 text-ink-2 hover:bg-surface aria-[current=page]:bg-ink aria-[current=page]:text-paper"
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "detectadas" ? (
        detectedRows.length === 0 ? (
          <Empty title="No hay noticias detectadas pendientes" />
        ) : (
          <ul className="divide-y divide-line rounded-md border border-line bg-paper">
            {detectedRows.map(({ d, search }) => {
              const best = search ? bestCandidate(search) : null;
              return (
                <li key={d.id} className="grid grid-cols-[96px_1fr] items-center gap-4 p-4">
                  <div className="aspect-[3/2] overflow-hidden rounded-xs bg-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {best && <img src={best.previewUrl} alt="" className="h-full w-full object-cover" loading="lazy" />}
                  </div>
                  <div className="min-w-0 text-[13px]">
                    <p className="truncate font-medium text-ink">{d.title}</p>
                    <p className="mt-0.5 text-muted">
                      {d.sourceName} · {formatSmart(d.detectedAt)} ·{" "}
                      {!search ? "Sin buscar todavía" : best ? `Propuesta: ${best.licenseName}${best.author ? ` · ${best.author}` : ""}` : "Sin imagen autorizada: quedará pendiente de selección manual"}
                    </p>
                    {search?.candidates.some((c) => c.provider === "feed" && !c.usable) && (
                      <p className="mt-0.5 text-warn">El feed incluye imagen, pero la fuente no ha autorizado su reutilización.</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : list.length === 0 ? (
        <Empty title="Nada en esta vista" />
      ) : (
        <ul className="divide-y divide-line rounded-md border border-line bg-paper">
          {list.map((r) => {
            const best = r.search ? bestCandidate(r.search) : null;
            return (
              <li key={r.key} className="grid grid-cols-[96px_1fr] items-center gap-4 p-4 sm:grid-cols-[96px_1fr_auto]">
                <div className="relative aspect-[3/2] overflow-hidden rounded-xs bg-surface">
                  { }
                  {(r.state === "proposed" && best ? best.previewUrl : r.image.src) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.state === "proposed" && best ? best.previewUrl : r.image.src} alt="" className={`h-full w-full ${r.type === "phone" ? "object-contain" : "object-cover"}`} loading="lazy" />
                  )}
                </div>
                <div className="min-w-0 text-[13px]">
                  <p className="font-medium text-ink">{r.title}</p>
                  <p className="mt-0.5 text-muted">
                    {r.kind}
                    {r.state === "pending" && (r.image.illustrative ? " · Ilustración de demostración" : !r.image.src ? " · Sin imagen" : "")}
                    {r.state === "pending" && r.search && ` · Última búsqueda ${formatSmart(r.search.createdAt)}: sin imágenes autorizadas que coincidan`}
                    {r.state === "proposed" && best && ` · Propuesta: ${best.licenseName}${best.author ? `, ${best.author}` : ""} (${best.provider})`}
                    {r.state === "approved" && r.image.meta && ` · ${r.image.meta.licenseName}${r.image.meta.author ? `, ${r.image.meta.author}` : ""}`}
                  </p>
                </div>
                {/* Las fichas enlazadas con la biblioteca de móviles se gestionan allí (portada, frontal y trasera). */}
                <Link href={r.deviceId ? `/admin/imagenes/biblioteca/${r.deviceId}` : `/admin/imagenes/${r.type}/${r.id}`} className="btn-secondary btn-sm col-span-2 sm:col-span-1">
                  {r.state === "proposed" ? "Revisar propuesta" : r.state === "approved" ? "Cambiar" : "Elegir imagen"}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AdminPage>
  );
}
