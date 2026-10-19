import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/PageHeader";
import { ImageCredit } from "@/components/ui/ImageCredit";
import { Photo } from "@/components/ui/Photo";
import { getDevices, getPhones, getPublishedPosts } from "@/lib/content";
import { approvedPhotos, slotLabel } from "@/lib/devices";
import { phoneHref, phoneName } from "@/lib/phones";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Créditos de imágenes",
  description: "Autoría, procedencia y licencia de las fotografías publicadas.",
  alternates: { canonical: "/creditos-imagenes" },
};

export default async function CreditsPage() {
  const [posts, phones, devices] = await Promise.all([getPublishedPosts(), getPhones(), getDevices()]);
  const rows = [
    ...posts.filter((p) => p.cover.src && p.cover.meta).map((p) => ({ key: p.id, href: `/noticias/${p.slug}`, label: p.title, image: p.cover })),
    ...phones.filter((p) => p.image.meta).map((p) => ({ key: p.id, href: phoneHref(p), label: phoneName(p), image: p.image })),
    // Vistas frontal y trasera aprobadas en la biblioteca de móviles.
    ...phones.flatMap((p) =>
      approvedPhotos(p.deviceId ? devices.get(p.deviceId) : undefined)
        .filter((v) => v.slot !== "main")
        .map((v) => ({ key: `${p.id}-${v.slot}`, href: phoneHref(p), label: `${phoneName(p)} · ${slotLabel(v.slot).toLowerCase()}`, image: v.image })),
    ),
  ];
  return (
    <>
      <PageHeader
        kicker="Transparencia"
        title="Créditos de imágenes"
        description="Usamos fotografías propias, imágenes de prensa con permiso y fotografías con licencias que permiten su uso comercial. Aquí se recoge la autoría y la licencia de cada una."
      />
      <div className="container-x mt-10">
        {rows.length === 0 ? (
          <p className="text-[15px] text-muted">Todavía no hay fotografías con atribución publicadas.</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {rows.map((r) => (
              <li key={r.key} className="grid grid-cols-[72px_1fr] items-center gap-4 py-4">
                <div className="relative aspect-square overflow-hidden rounded-sm bg-surface">
                  <Photo image={r.image} alt="" sizes="72px" />
                </div>
                <div className="min-w-0">
                  <Link href={r.href} className="text-[15px] font-medium hover:underline">
                    {r.label}
                  </Link>
                  <p className="mt-1 text-[13px] text-muted">
                    <ImageCredit image={r.image} />
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
