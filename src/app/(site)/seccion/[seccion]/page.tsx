import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleList } from "@/components/news/ArticleList";
import { getPublished } from "@/lib/content";
import { SECTIONS, isSection, sectionName } from "@/lib/site";

export const revalidate = 60;

export function generateStaticParams() {
  return SECTIONS.map((s) => ({ seccion: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/seccion/[seccion]">): Promise<Metadata> {
  const { seccion } = await params;
  if (!isSection(seccion)) return {};
  const name = sectionName(seccion);
  return {
    title: `${name} en Baleares`,
    description: `${name}: últimas noticias de Mallorca, Menorca, Ibiza y Formentera.`,
    alternates: { canonical: `/seccion/${seccion}` },
  };
}

export default async function SectionPage({ params }: PageProps<"/seccion/[seccion]">) {
  const { seccion } = await params;
  if (!isSection(seccion)) notFound();
  const items = (await getPublished()).filter((a) => a.section === seccion);
  return <ArticleList title={sectionName(seccion)} items={items} empty="Aún no hay noticias en esta sección." />;
}
