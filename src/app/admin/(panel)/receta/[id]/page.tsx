import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getRecipe } from "@/lib/content";
import { recipePath } from "@/lib/recipes";
import { DeleteButton, Editor } from "./Editor";
import { deleteRecipe } from "./actions";

export default async function RecipeEditorPage({ params, searchParams }: PageProps<"/admin/receta/[id]">) {
  await requireUser();
  const { id } = await params;
  const { ok } = await searchParams;
  const recipe = id === "nueva" ? null : await getRecipe(id);
  if (id !== "nueva" && !recipe) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{recipe ? "Editar receta" : "Nueva receta"}</h1>
        {recipe?.status === "published" && (
          <a href={recipePath(recipe)} target="_blank" className="text-sm underline underline-offset-2">
            Ver en la web ↗
          </a>
        )}
      </div>
      <Editor
        key={recipe?.id ?? "nueva"}
        recipe={recipe}
        defaultAuthor=""
        aiEnabled={Boolean(process.env.ANTHROPIC_API_KEY)}
        flash={typeof ok === "string" ? ok : undefined}
      />
      {recipe && (
        <form action={deleteRecipe} className="border-t border-line pt-6">
          <input type="hidden" name="id" value={recipe.id} />
          <DeleteButton />
        </form>
      )}
    </div>
  );
}
