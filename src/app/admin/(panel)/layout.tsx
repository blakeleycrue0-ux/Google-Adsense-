import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { imageState } from "@/lib/images/state";
import { logout } from "../login/actions";

export const metadata: Metadata = { title: "Panel", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [detected, messages, posts, phones] = await Promise.all([db().list("detected"), db().list("messages"), db().list("posts"), db().list("phones")]);
  const imagesPending = posts.filter((p) => imageState(p.cover) !== "approved").length + phones.filter((p) => imageState(p.image) !== "approved").length;
  const groups = [
    {
      title: "Contenido",
      items: [
        { href: "/admin", label: "Resumen" },
        { href: "/admin/articulos", label: "Artículos", badge: posts.filter((p) => p.status === "review").length },
        { href: "/admin/deteccion", label: "Detección de noticias", badge: detected.filter((d) => d.status === "new" && !d.duplicateOf).length },
        { href: "/admin/fuentes", label: "Fuentes" },
        { href: "/admin/categorias", label: "Categorías" },
        { href: "/admin/imagenes", label: "Imágenes", badge: imagesPending },
        { href: "/admin/medios", label: "Biblioteca" },
      ],
    },
    {
      title: "Comercio",
      items: [
        { href: "/admin/moviles", label: "Fichas de móviles" },
        { href: "/admin/guias", label: "Guías de compra" },
        { href: "/admin/ofertas", label: "Ofertas" },
        { href: "/admin/enlaces", label: "Enlaces de compra" },
        { href: "/admin/tiendas", label: "Tiendas y afiliados" },
      ],
    },
    {
      title: "Sitio",
      items: [
        { href: "/admin/estadisticas", label: "Estadísticas" },
        { href: "/admin/mensajes", label: "Mensajes", badge: messages.filter((m) => !m.read).length },
        { href: "/admin/paginas", label: "Páginas legales" },
        ...(user.role === "admin"
          ? [
              { href: "/admin/publicidad", label: "Publicidad" },
              { href: "/admin/ajustes", label: "Ajustes" },
              { href: "/admin/usuarios", label: "Usuarios" },
            ]
          : []),
      ],
    },
  ];
  return (
    <div className="min-h-dvh bg-[#fafafa]">
      <AdminNav groups={groups} user={{ name: user.name, role: user.role }} logout={logout} />
      <main className="lg:pl-60">{children}</main>
    </div>
  );
}
