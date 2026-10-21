import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeList } from "@/components/recipes/RecipeList";
import { getByCategory } from "@/lib/content";
import { CATEGORIES, isCategory } from "@/lib/site";

export const revalidate = 60;
export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ categoria: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/recetas/[categoria]">): Promise<Metadata> {
  const { categoria } = await params;
  const c = CATEGORIES.find((x) => x.id === categoria);
  if (!c) return {};
  return { title: `Recetas: ${c.name}`, description: c.description, alternates: { canonical: `/recetas/${c.id}` } };
}

export default async function CategoryPage({ params }: PageProps<"/recetas/[categoria]">) {
  const { categoria } = await params;
  if (!isCategory(categoria)) notFound();
  const c = CATEGORIES.find((x) => x.id === categoria)!;
  return <RecipeList title={c.name} intro={c.description} recipes={await getByCategory(c.id)} empty="Aún no hay recetas en esta categoría." />;
}
