import type { Metadata } from "next";
import { RecipeList } from "@/components/recipes/RecipeList";
import { getPublished } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Todas las recetas",
  description: "Todas las recetas, de la más nueva a la más antigua: entrantes, arroces, cuchara, carnes, pescados, postres y bases de cocina.",
  alternates: { canonical: "/recetas" },
};

export default async function AllRecipesPage() {
  return <RecipeList title="Todas las recetas" recipes={await getPublished()} empty="Aún no hay recetas publicadas." />;
}
