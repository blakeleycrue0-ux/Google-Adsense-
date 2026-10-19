import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/PageHeader";
import { ArrowRight } from "@/components/ui/Icons";
import { getGuides } from "@/lib/content";
import { formatDate } from "@/lib/format";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Comparativas y guías de compra de móviles",
  description: "Guías por presupuesto para elegir móvil: menos de 200, 300 y 500 euros, y gama alta. Con comparador y fichas técnicas.",
  alternates: { canonical: "/comparativas" },
};

export default async function GuidesPage() {
  const guides = await getGuides();
  return (
    <>
      <PageHeader
        kicker="Guías de compra"
        emoji="⚖️"
        title="Comparativas"
        description="Selecciones editoriales por presupuesto. Explicamos qué exigir en cada rango y por qué incluimos cada modelo."
      />
      <div className="container-x mt-12">
        <ol className="grid border-t border-ink sm:grid-cols-2">
          {guides.map((g, i) => (
            <li key={g.id} className={`border-b border-line ${i % 2 === 0 ? "sm:border-r sm:pr-8" : "sm:pl-8"}`}>
              <Link href={`/comparativas/${g.slug}`} className="group flex h-full flex-col py-8">
                <span className="font-mono text-[12px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="headline mt-4 text-[30px] sm:text-[36px]">
                  {g.emoji && (
                    <span aria-hidden className="mr-2 text-[0.8em]">
                      {g.emoji}
                    </span>
                  )}
                  <span className="link-title">{g.title}</span>
                </h2>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">{g.intro}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium">
                  {g.phoneIds.length} modelos · actualizada el {formatDate(g.updatedAt)}
                  <ArrowRight width={15} height={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <div className="mt-16 grid gap-6 rounded-md bg-surface p-8 sm:grid-cols-[1fr_auto] sm:items-center sm:p-10">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.025em]">¿Dudas entre dos modelos concretos?</h2>
            <p className="mt-2 text-[15px] text-muted">Ponlos lado a lado en el comparador, con el valor más favorable de cada fila marcado.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/comparar" className="btn-primary">
              Abrir comparador
            </Link>
            <Link href="/moviles" className="btn-secondary">
              Buscador con filtros
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
