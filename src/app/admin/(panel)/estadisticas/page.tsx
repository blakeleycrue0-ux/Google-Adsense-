import Link from "next/link";
import { BarChart } from "@/components/admin/BarChart";
import { AdminPage, Panel, Table } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { clickStats, viewStats } from "@/lib/stats";

export default async function StatsPage() {
  await requireUser();
  const [views, clicks, posts, links, settings] = await Promise.all([viewStats(30), clickStats(30), db().list("posts"), db().list("links"), getSettings()]);
  const topPosts = [...views.perItem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  const topLinks = [...clicks.perItem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  return (
    <AdminPage
      title="Estadísticas"
      description="Datos reales de los contadores internos: lecturas de artículos (una por sesión) y clics en enlaces de compra. Para audiencia completa, ingresos y conversiones consulta Google Analytics, AdSense y los paneles de afiliación."
    >
      {!settings.analytics.gaMeasurementId && (
        <p className="mb-6 rounded-sm border border-dashed border-line-strong bg-paper px-4 py-3 text-[13px] text-muted">
          Google Analytics no está conectado. Añade tu ID de medición (G-XXXX) en <Link href="/admin/ajustes" className="underline">Ajustes</Link>.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Lecturas por día (30 días)"><BarChart data={views.perDay} label="Lecturas" /></Panel>
        <Panel title="Clics en enlaces de compra (30 días)"><BarChart data={clicks.perDay} label="Clics" /></Panel>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Table>
          <thead><tr><th>Artículo</th><th>Lecturas 30 d</th><th>Total</th></tr></thead>
          <tbody>
            {topPosts.length ? topPosts.map(([id, n]) => (
              <tr key={id}><td className="max-w-[300px] truncate">{posts.find((p) => p.id === id)?.title ?? id}</td><td>{n}</td><td>{views.totals.get(id) ?? n}</td></tr>
            )) : <tr><td colSpan={3} className="text-muted">Sin datos todavía.</td></tr>}
          </tbody>
        </Table>
        <Table>
          <thead><tr><th>Enlace</th><th>Clics 30 d</th><th>Total</th></tr></thead>
          <tbody>
            {topLinks.length ? topLinks.map(([id, n]) => (
              <tr key={id}><td className="max-w-[300px] truncate">{links.find((l) => l.id === id)?.label ?? id}</td><td>{n}</td><td>{clicks.totals.get(id) ?? n}</td></tr>
            )) : <tr><td colSpan={3} className="text-muted">Sin datos todavía.</td></tr>}
          </tbody>
        </Table>
      </div>
    </AdminPage>
  );
}
