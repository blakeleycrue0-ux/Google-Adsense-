import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleList } from "@/components/news/ArticleList";
import { getPublished } from "@/lib/content";
import { ISLANDS, isIsland, islandName } from "@/lib/site";

export const revalidate = 60;

export function generateStaticParams() {
  return ISLANDS.map((i) => ({ isla: i.id }));
}

export async function generateMetadata({ params }: PageProps<"/isla/[isla]">): Promise<Metadata> {
  const { isla } = await params;
  if (!isIsland(isla)) return {};
  const name = islandName(isla);
  return {
    title: `Noticias de ${name}`,
    description: `Últimas noticias de ${name}: sucesos, tráfico, tiempo, sociedad, política y agenda.`,
    alternates: { canonical: `/isla/${isla}` },
  };
}

export default async function IslandPage({ params }: PageProps<"/isla/[isla]">) {
  const { isla } = await params;
  if (!isIsland(isla)) notFound();
  const items = (await getPublished()).filter((a) => a.island === isla);
  const name = islandName(isla);
  return (
    <ArticleList
      title={isla === "baleares" ? "Noticias de Baleares" : `Noticias de ${name}`}
      intro={isla === "baleares" ? "Noticias que afectan a todas las islas: Govern, Parlament, tiempo y servicios." : undefined}
      items={items}
      empty={`Aún no hay noticias de ${name}.`}
    />
  );
}
