import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getLegalPage } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await db().list("legal")).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const page = await getLegalPage((await params).slug);
  if (!page) return { title: "Página no encontrada" };
  return { title: page.title, alternates: { canonical: `/legal/${page.slug}` } };
}

export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const page = await getLegalPage((await params).slug);
  if (!page) notFound();
  const others = (await db().list("legal")).filter((p) => p.slug !== page.slug);
  return (
    <div className="container-x pt-10 sm:pt-14">
      <div className="mx-auto grid max-w-[1040px] gap-12 lg:grid-cols-[1fr_220px]">
        <article>
          <p className="kicker text-muted">Información</p>
          <h1 className="headline mt-3 text-[40px] sm:text-[52px]">{page.title}</h1>
          <p className="mt-4 text-[13px] text-muted">Última actualización: {formatDate(page.updatedAt)}</p>
          {page.needsLegalReview && (
            <p className="mt-6 rounded-sm border border-dashed border-line-strong bg-surface px-4 py-3 text-[13px] text-muted">
              <span className="kicker mr-2 text-ink">Borrador</span>
              Plantilla pendiente de revisión legal y de completar con los datos reales del titular.
            </p>
          )}
          <div className="prose-article prose-compact mt-10" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }} />
        </article>
        <nav aria-label="Otras páginas" className="lg:pt-24">
          <p className="kicker border-t-2 border-ink pt-4 text-ink">Más información</p>
          <ul className="mt-3 space-y-2.5 text-[14px]">
            {others.map((p) => (
              <li key={p.id}>
                <Link href={`/legal/${p.slug}`} className="text-ink-2 hover:text-ink">
                  {p.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/contacto" className="text-ink-2 hover:text-ink">
                Contacto
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
