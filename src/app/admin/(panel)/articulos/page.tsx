import Link from "next/link";
import { AdminPage, Empty, StatusPill, Table } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatSmart, normalizeText } from "@/lib/format";

const FILTERS = [
  { id: "", label: "Todos" },
  { id: "published", label: "Publicados" },
  { id: "scheduled", label: "Programados" },
  { id: "review", label: "En revisión" },
  { id: "draft", label: "Borradores" },
];

export default async function PostsAdmin({ searchParams }: PageProps<"/admin/articulos">) {
  await requireUser();
  const sp = await searchParams;
  const estado = typeof sp.estado === "string" ? sp.estado : "";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const [posts, cats] = await Promise.all([db().list("posts"), db().list("categories")]);
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const list = posts
    .filter((p) => !estado || p.status === estado)
    .filter((p) => !q || normalizeText(p.title).includes(normalizeText(q)))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <AdminPage
      title="Artículos"
      description="Crea, edita, programa y publica noticias. Nada se publica sin pasar por aquí."
      actions={<Link href="/admin/articulos/nuevo" className="btn-primary">Nuevo artículo</Link>}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Link
              key={f.id}
              href={f.id ? `/admin/articulos?estado=${f.id}` : "/admin/articulos"}
              aria-current={estado === f.id ? "page" : undefined}
              className="h-8 rounded-sm px-3 text-[13px] leading-8 text-ink-2 hover:bg-surface aria-[current=page]:bg-ink aria-[current=page]:text-paper"
            >
              {f.label} <span className="opacity-60">{f.id ? posts.filter((p) => p.status === f.id).length : posts.length}</span>
            </Link>
          ))}
        </div>
        <form className="flex gap-2">
          {estado && <input type="hidden" name="estado" value={estado} />}
          <input name="q" defaultValue={q} placeholder="Buscar por título…" className="field h-8 w-56 text-[13px]" />
        </form>
      </div>
      {list.length ? (
        <Table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="hover:bg-surface/50">
                <td className="max-w-[420px]">
                  <Link href={`/admin/articulos/${p.id}`} className="font-medium hover:underline">
                    {p.title}
                  </Link>
                  {p.isDemo && <span className="ml-2 font-mono text-[10px] uppercase text-faint">demo</span>}
                </td>
                <td className="text-muted">{catName.get(p.categoryId)}</td>
                <td>
                  <StatusPill status={p.status} />
                </td>
                <td className="whitespace-nowrap text-[13px] text-muted">{formatSmart(p.publishedAt ?? p.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Empty title="No hay artículos con estos filtros" />
      )}
    </AdminPage>
  );
}
