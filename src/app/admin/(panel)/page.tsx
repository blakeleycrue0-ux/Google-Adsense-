import Link from "next/link";
import { BarChart } from "@/components/admin/BarChart";
import { AdminPage, Panel, StatusPill } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatSmart } from "@/lib/format";
import { adsActive, getSettings } from "@/lib/settings";
import { clickStats, viewStats } from "@/lib/stats";

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const user = await requireUser();
  const err = (await searchParams).error;
  const [posts, detected, messages, settings, views, clicks, phones, legal] = await Promise.all([
    db().list("posts"),
    db().list("detected"),
    db().list("messages"),
    getSettings(),
    viewStats(30),
    clickStats(30),
    db().list("phones"),
    db().list("legal"),
  ]);
  const published = posts.filter((p) => p.status === "published");
  const drafts = posts.filter((p) => p.status === "draft" || p.status === "review");
  const pending = detected.filter((d) => d.status === "new" && !d.duplicateOf);
  const totalViews = views.perDay.reduce((s, d) => s + d.value, 0);
  const totalClicks = clicks.perDay.reduce((s, d) => s + d.value, 0);
  const top = [...views.perItem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const recent = [...posts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);

  const checklist = [
    { ok: !settings.demoMode, label: "Desactivar el modo demostración (permite la indexación)", href: "/admin/ajustes" },
    { ok: !posts.some((p) => p.isDemo && p.status === "published"), label: "Retirar o revisar los artículos de demostración", href: "/admin/articulos" },
    { ok: !phones.some((p) => p.offers.some((o) => o.source === "demo")), label: "Sustituir los precios de demostración por precios comprobados", href: "/admin/moviles" },
    { ok: ![...posts.map((p) => p.cover), ...phones.map((p) => p.image)].some((i) => i.illustrative), label: "Sustituir las ilustraciones por fotografías con licencia", href: "/admin/imagenes" },
    { ok: Boolean(settings.legal.ownerName && settings.legal.taxId && settings.contactEmail), label: "Completar los datos legales del titular y el correo de contacto", href: "/admin/ajustes" },
    { ok: !legal.some((l) => l.needsLegalReview), label: "Revisión legal de las páginas de privacidad, cookies y aviso legal", href: "/admin/paginas" },
    { ok: Boolean(process.env.SESSION_SECRET), label: "Definir SESSION_SECRET en el entorno de producción" },
    { ok: db().kind === "supabase", label: "Conectar Supabase para producción (almacenamiento persistente)" },
    { ok: Boolean(settings.analytics.gaMeasurementId), label: "Conectar Google Analytics (opcional)", href: "/admin/ajustes" },
  ];

  return (
    <AdminPage title={`Hola, ${user.name.split(" ")[0]} 👋`} description="Resumen de la actividad editorial y comercial.">
      {err === "permisos" && (
        <p className="mb-6 rounded-sm border border-live px-4 py-3 text-[13px] text-live">No tienes permisos para acceder a esa sección.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Publicados", value: published.length, href: "/admin/articulos?estado=published" },
          { label: "Borradores y revisión", value: drafts.length, href: "/admin/articulos?estado=draft" },
          { label: "Noticias detectadas por revisar", value: pending.length, href: "/admin/deteccion" },
          { label: "Mensajes sin leer", value: messages.filter((m) => !m.read).length, href: "/admin/mensajes" },
        ].map((k) => (
          <Link key={k.label} href={k.href} className="rounded-md border border-line bg-paper p-5 transition-colors hover:border-ink">
            <p className="text-[13px] text-muted">{k.label}</p>
            <p className="mt-2 text-[32px] font-semibold leading-none tracking-[-0.04em] tabular-nums">{k.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Lecturas de artículos · 30 días" description="Contador interno real (una por sesión y artículo, sin bots conocidos)." className="lg:col-span-2">
          <p className="mb-4 text-[28px] font-semibold tracking-[-0.03em] tabular-nums">{totalViews.toLocaleString("es-ES")}</p>
          <BarChart data={views.perDay} label="Lecturas diarias" />
        </Panel>
        <Panel title="Clics en enlaces de compra · 30 días">
          <p className="mb-4 text-[28px] font-semibold tracking-[-0.03em] tabular-nums">{totalClicks.toLocaleString("es-ES")}</p>
          <BarChart data={clicks.perDay} label="Clics diarios" />
          <p className="mt-3 text-[12px] text-muted">Las comisiones se consultan en el panel de cada programa de afiliación.</p>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Lo más leído · 30 días">
          {top.length ? (
            <ol className="space-y-2.5 text-[14px]">
              {top.map(([id, n]) => {
                const p = posts.find((x) => x.id === id);
                return (
                  <li key={id} className="flex justify-between gap-4">
                    <Link href={`/admin/articulos/${id}`} className="truncate hover:underline">{p?.title ?? id}</Link>
                    <span className="font-mono text-[12px] text-muted">{n}</span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-[14px] text-muted">Aún no hay lecturas registradas.</p>
          )}
        </Panel>
        <Panel title="Actividad reciente">
          <ul className="space-y-2.5 text-[14px]">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3">
                <Link href={`/admin/articulos/${p.id}`} className="truncate hover:underline">{p.title}</Link>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-[12px] text-muted">{formatSmart(p.updatedAt)}</span>
                  <StatusPill status={p.status} />
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Antes de publicar el sitio" description="Lista de comprobación basada en la configuración actual.">
          <ul className="space-y-2.5 text-[14px]">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-start gap-2.5">
                <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] ${c.ok ? "bg-ok text-paper" : "border border-line-strong"}`}>
                  {c.ok ? "✓" : ""}
                </span>
                {c.href ? <Link href={c.href} className={c.ok ? "text-muted line-through" : "hover:underline"}>{c.label}</Link> : <span className={c.ok ? "text-muted line-through" : ""}>{c.label}</span>}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Integraciones">
          <dl className="space-y-3 text-[14px]">
            {[
              ["Almacenamiento", db().kind === "supabase" ? "Supabase conectado" : "Ficheros JSON locales (demo/desarrollo)"],
              ["Google AdSense", adsActive(settings) ? `Activo · ${settings.ads.client}` : "No activo"],
              ["Google Analytics", settings.analytics.gaMeasurementId ? `Configurado · ${settings.analytics.gaMeasurementId}` : "No conectado"],
              ["Consentimiento", settings.consent.mode === "builtin" ? "Banner propio + Consent Mode v2" : "CMP externa certificada"],
              ["Asistente IA para borradores", process.env.ANTHROPIC_API_KEY ? "Configurado" : "No configurado (opcional)"],
              ["Detección automática (cron)", process.env.CRON_SECRET ? "Endpoint protegido listo" : "Falta CRON_SECRET"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line pb-2.5 last:border-0">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </AdminPage>
  );
}
