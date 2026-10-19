"use client";

import { useState, useTransition } from "react";
import { previewMarkdown, savePost } from "@/app/admin/(panel)/articulos/actions";
import { isoToMadridLocal } from "@/lib/format";
import type { Author, Category, Post } from "@/lib/types";
import { ActionForm, SubmitButton } from "./forms";
import { Field, Panel, StatusPill } from "./ui";

export function PostEditor({
  post,
  categories,
  authors,
  image,
}: {
  post?: Post;
  categories: Category[];
  authors: Author[];
  image: { state: "approved" | "proposed" | "pending"; credit?: string };
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [body, setBody] = useState(post?.body ?? "");
  const [html, setHtml] = useState("");
  const [title, setTitle] = useState(post?.title ?? "");
  const [subtitle, setSubtitle] = useState(post?.subtitle ?? "");
  const [pending, start] = useTransition();

  const showPreview = () => {
    setTab("preview");
    start(async () => setHtml(await previewMarkdown(body)));
  };

  const words = body.split(/\s+/).filter(Boolean).length;
  const sourcesText = (post?.sources ?? []).map((s) => `${s.title} | ${s.publisher} | ${s.url}`).join("\n");

  return (
    <ActionForm action={savePost} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {post && <input type="hidden" name="id" value={post.id} />}
      <div className="min-w-0 space-y-6">
        <Panel>
          <div className="space-y-5">
            <Field label="Título" hint={`${title.length}/160 · Claro y preciso, sin exageraciones.`}>
              <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} className="field h-12 text-[18px] font-semibold" required maxLength={160} />
            </Field>
            <Field label="Subtítulo" hint={`${subtitle.length}/320 · Resume la noticia en una o dos frases.`}>
              <textarea name="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} rows={2} className="field" maxLength={320} />
            </Field>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="label mb-0">Cuerpo (Markdown)</span>
                <div className="flex gap-1 rounded-sm bg-surface p-0.5" role="tablist">
                  <button type="button" role="tab" aria-selected={tab === "write"} onClick={() => setTab("write")} className="h-7 rounded-xs px-2.5 text-[12px] aria-selected:bg-paper aria-selected:shadow-sm">
                    Escribir
                  </button>
                  <button type="button" role="tab" aria-selected={tab === "preview"} onClick={showPreview} className="h-7 rounded-xs px-2.5 text-[12px] aria-selected:bg-paper aria-selected:shadow-sm">
                    Vista previa
                  </button>
                </div>
              </div>
              <textarea
                name="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={22}
                className={`field font-mono text-[13px] leading-relaxed ${tab === "write" ? "" : "hidden"}`}
                placeholder={"Entradilla…\n\n## Primer apartado\n\nTexto…"}
              />
              {tab === "preview" && (
                <div className="min-h-[300px] rounded-sm border border-line p-6">
                  {pending ? <p className="text-[13px] text-muted">Generando vista previa…</p> : <div className="prose-article prose-compact" dangerouslySetInnerHTML={{ __html: html }} />}
                </div>
              )}
              <p className="mt-1.5 text-[12px] text-muted">
                {words} palabras · Usa «## Apartado» para dividir el texto, **negrita**, listas con «-» y enlaces [texto](https://…). Redacta con tus palabras: no copies textos de otros medios.
              </p>
            </div>
          </div>
        </Panel>

        <Panel title="Fuentes" description="Una por línea: Título | Medio | URL. Se muestran al final del artículo.">
          <textarea name="sources" defaultValue={sourcesText} rows={4} className="field font-mono text-[12px]" placeholder="Comunicado oficial | Apple Newsroom | https://www.apple.com/newsroom/…" />
        </Panel>

        <Panel title="SEO" description="Opcional. Si se deja vacío, se usan el título y el subtítulo.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título SEO (máx. 70)">
              <input name="seoTitle" defaultValue={post?.seoTitle} maxLength={70} className="field" />
            </Field>
            <Field label="URL (slug)" hint="Se genera a partir del título si se deja vacío.">
              <input name="slug" defaultValue={post?.slug} className="field font-mono text-[13px]" />
            </Field>
            <Field label="Meta descripción (máx. 170)" className="sm:col-span-2">
              <textarea name="seoDescription" defaultValue={post?.seoDescription} maxLength={170} rows={2} className="field" />
            </Field>
          </div>
        </Panel>
      </div>

      <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <Panel title="Publicación">
          <div className="space-y-4">
            {post && (
              <p className="flex items-center gap-2 text-[13px] text-muted">
                Estado: <StatusPill status={post.status} />
              </p>
            )}
            <div className="grid gap-2">
              <SubmitButton name="intent" value="publish">
                {post?.status === "published" ? "Actualizar publicación" : "Publicar ahora"}
              </SubmitButton>
              <SubmitButton name="intent" value="draft" variant="secondary">
                Guardar borrador
              </SubmitButton>
              {post?.status !== "published" && (
                <SubmitButton name="intent" value="review" variant="secondary">
                  Enviar a revisión
                </SubmitButton>
              )}
            </div>
            <details className="rounded-sm border border-line p-3 text-[13px]">
              <summary className="cursor-pointer font-medium">Programar</summary>
              <div className="mt-3 space-y-2">
                <input type="datetime-local" name="scheduledAt" defaultValue={post?.status === "scheduled" ? isoToMadridLocal(post.publishedAt) : ""} className="field" />
                <p className="text-[12px] text-muted">Hora peninsular española.</p>
                <SubmitButton name="intent" value="schedule" variant="secondary" className="w-full">
                  Programar publicación
                </SubmitButton>
              </div>
            </details>
            {post?.status === "published" && (
              <SubmitButton name="intent" value="unpublish" variant="secondary" className="w-full">
                Retirar de la web
              </SubmitButton>
            )}
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" name="isFeatured" defaultChecked={post?.isFeatured} className="size-4 accent-ink" /> Destacar en portada
            </label>
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" name="isBreaking" defaultChecked={post?.isBreaking} className="size-4 accent-ink" /> Marcar como «Última hora» 🔴
            </label>
          </div>
        </Panel>

        <Panel title="Clasificación">
          <div className="space-y-4">
            <Field label="Categoría">
              <select name="categoryId" defaultValue={post?.categoryId ?? ""} className="field" required>
                <option value="" disabled>
                  Elige…
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Etiquetas" hint="Separadas por comas.">
              <input name="tags" defaultValue={post?.tags.join(", ")} className="field" />
            </Field>
            <Field label="Autoría">
              <select name="authorId" defaultValue={post?.authorId ?? authors[0]?.id} className="field">
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Panel>

        <Panel title="Imagen principal">
          <div className="space-y-4">
            <div className={`relative aspect-[16/10] overflow-hidden rounded-sm bg-surface ${image.state === "approved" ? "" : "border border-dashed border-line-strong"}`}>
              {post?.cover.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.cover.src} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-[12px] text-muted">Sin imagen</span>
              )}
            </div>
            <p className="text-[12px] text-muted">
              {image.state === "approved" && <>✓ Imagen aprobada{image.credit ? ` · ${image.credit}` : ""}</>}
              {image.state === "proposed" && <>Hay una propuesta de imagen esperando tu aprobación.</>}
              {image.state === "pending" && <>{post?.cover.illustrative ? "Ilustración de demostración: sustitúyela por una fotografía autorizada." : "Pendiente de selección."}</>}
            </p>
            {post ? (
              <a href={`/admin/imagenes/post/${post.id}`} className="btn-secondary btn-sm w-full">
                {image.state === "approved" ? "Cambiar imagen" : image.state === "proposed" ? "Revisar propuesta" : "Elegir imagen"}
              </a>
            ) : (
              <p className="text-[12px] text-muted">Guarda el borrador para buscar y asignar una imagen.</p>
            )}
            <Field label="Texto alternativo" hint="Describe la imagen para personas que no pueden verla.">
              <input name="coverAlt" defaultValue={post?.cover.alt} className="field" />
            </Field>
          </div>
        </Panel>
      </div>
    </ActionForm>
  );
}
