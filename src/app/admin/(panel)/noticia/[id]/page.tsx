import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DeleteButton, Editor } from "./Editor";
import { deleteArticle } from "./actions";

export default async function ArticleEditorPage({ params, searchParams }: PageProps<"/admin/noticia/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const { ok } = await searchParams;
  const article = id === "nueva" ? null : await db().get("articles", id);
  if (id !== "nueva" && !article) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{article ? "Editar noticia" : "Nueva noticia"}</h1>
        {article?.status === "published" && (
          <a href={`/noticia/${article.slug}`} target="_blank" className="text-sm text-sea underline underline-offset-2">
            Ver publicada ↗
          </a>
        )}
      </div>
      <Editor
        key={article?.id ?? "nueva"}
        article={article}
        defaultAuthor={user.name}
        aiEnabled={Boolean(process.env.ANTHROPIC_API_KEY)}
        flash={typeof ok === "string" ? ok : undefined}
      />
      {article && (
        <form action={deleteArticle} className="border-t border-line pt-6">
          <input type="hidden" name="id" value={article.id} />
          <DeleteButton />
        </form>
      )}
    </div>
  );
}
