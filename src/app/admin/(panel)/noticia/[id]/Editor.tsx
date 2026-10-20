"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { photoCredit } from "@/lib/photos";
import { ISLANDS, PHOTO_LICENSES, SECTIONS, type PhotoLicense } from "@/lib/site";
import type { Article } from "@/lib/types";
import { checkAiDraft, saveArticle, startAiDraft, uploadPhoto, type AiResult } from "./actions";

type UploadedPhoto = { url: string; path: string; width: number; height: number };

/**
 * Reduce la foto en el navegador (máx. 2000 px, JPEG) antes de subirla: las
 * fotos del móvil pesan 4-10 MB y así la subida es rápida y cabe en el límite
 * de Netlify. Si el navegador no puede, se sube tal cual.
 */
async function shrink(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 2000 / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Editor({ article, defaultAuthor, aiEnabled, flash }: { article: Article | null; defaultAuthor: string; aiEnabled: boolean; flash?: string }) {
  const [state, action, saving] = useActionState(saveArticle, flash ? { ok: true, message: flash } : null);
  const [title, setTitle] = useState(article?.title ?? "");
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [island, setIsland] = useState<string>(article?.island ?? "mallorca");
  const [section, setSection] = useState<string>(article?.section ?? "sociedad");
  const [photo, setPhoto] = useState<UploadedPhoto | null>(
    article?.photo ? { url: article.photo.url, path: article.photo.path ?? "", width: article.photo.width, height: article.photo.height } : null,
  );
  const [license, setLicense] = useState<PhotoLicense>(article?.photo?.license ?? "own");
  const [author, setAuthor] = useState(article?.photo?.author ?? "");
  const [uploadError, setUploadError] = useState("");
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [notes, setNotes] = useState("");
  const [aiOpen, setAiOpen] = useState(!article);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  const words = body.split(/\s+/).filter(Boolean).length;
  const published = article?.status === "published";

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    startUpload(async () => {
      const fd = new FormData();
      fd.set("file", await shrink(file));
      const res = await uploadPhoto(fd);
      if (res.ok) setPhoto(res);
      else setUploadError(res.error);
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  async function runAi() {
    setAiError("");
    setAiBusy(true);
    try {
      let res: AiResult | { ok: true; pending: true } = await startAiDraft({ notes, island, section });
      // En Netlify se redacta en segundo plano: se consulta cada 3 s durante 3 minutos.
      for (let i = 0; res.ok && "jobId" in res && i < 60; i++) {
        await sleep(3000);
        const jobId: string = res.jobId;
        const check = await checkAiDraft(jobId);
        res = check.ok && "pending" in check ? { ok: true, jobId } : check;
      }
      if (!res.ok) return setAiError(res.error);
      if (!("draft" in res)) return setAiError("El asistente está tardando demasiado. Inténtalo de nuevo.");
      if ((title || body) && !confirm("¿Sustituir el titular, la entradilla y el texto actuales por el borrador?")) return;
      setTitle(res.draft.title);
      setSummary(res.draft.summary);
      setBody(res.draft.body);
      setAiOpen(false);
    } catch {
      setAiError("No se ha podido conectar con el asistente. Inténtalo de nuevo.");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {article && <input type="hidden" name="id" value={article.id} />}

      <div className="space-y-5">
        {aiEnabled && (
          <section className="rounded-lg border border-sea/30 bg-[#eef6fb]">
            <button type="button" onClick={() => setAiOpen((v) => !v)} className="flex w-full items-center justify-between p-4 text-left font-semibold text-sea-dark">
              ✨ Redactar con IA a partir de tus notas
              <span aria-hidden>{aiOpen ? "−" : "+"}</span>
            </button>
            {aiOpen && (
              <div className="space-y-3 px-4 pb-4">
                <p className="text-sm text-ink-2">
                  Pega una nota de prensa oficial (Govern, ayuntamiento, Guardia Civil, 112…) o escribe lo que has visto: qué, dónde, cuándo y quién
                  lo cuenta. El asistente prepara un borrador; <strong>revísalo siempre</strong> antes de publicar.
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={7}
                  className="field"
                  placeholder="Ej.: Esta mañana sobre las 8:30 un camión ha volcado en la Ma-13 a la altura de Inca dirección Palma. Hay retenciones de 5 km. Fuente: DGT / 112 Illes Balears…"
                />
                {aiError && <p className="text-sm text-live">{aiError}</p>}
                <button type="button" onClick={runAi} disabled={aiBusy || notes.trim().length < 30} className="btn btn-primary">
                  {aiBusy ? "Redactando… (puede tardar hasta un minuto)" : "Preparar borrador"}
                </button>
              </div>
            )}
          </section>
        )}

        <label className="block space-y-1">
          <span className="text-sm font-semibold">Titular</span>
          <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} className="field text-lg font-semibold" />
          <span className={`text-xs ${title.length > 110 ? "text-warn" : "text-muted"}`}>{title.length}/110 recomendados</span>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">Entradilla</span>
          <textarea name="summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} maxLength={400} className="field" />
          <span className="text-xs text-muted">Resume en 1-2 frases: qué, quién, dónde y cuándo. Es lo que se ve en Google.</span>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">Texto de la noticia</span>
          <textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} rows={18} className="field font-[inherit] leading-relaxed" />
          <span className={`text-xs ${words < 120 ? "text-warn" : "text-muted"}`}>
            {words} palabras {words < 120 && "(mínimo 120 para publicar; lo ideal, 250 o más)"} · Formato: deja una línea en blanco entre
            párrafos, **negrita**, ## Subtítulo, [texto](https://enlace)
          </span>
        </label>
      </div>

      <aside className="space-y-5">
        <div className="space-y-3 rounded-lg border border-line bg-paper p-4">
          <p className="text-sm">
            Estado: <strong>{published ? "Publicada" : article ? "Borrador" : "Sin guardar"}</strong>
          </p>
          {state && <p className={`rounded p-2 text-sm ${state.ok ? "bg-[#e7f6ec] text-ok" : "bg-[#fdecea] text-live"}`}>{state.message}</p>}
          <div className="flex flex-wrap gap-2">
            <button name="intent" value="publish" disabled={saving || uploading} className="btn btn-primary flex-1">
              {published ? "Guardar cambios" : "Publicar"}
            </button>
            <button name="intent" value="draft" disabled={saving || uploading} className="btn btn-ghost flex-1">
              {published ? "Retirar (borrador)" : "Guardar borrador"}
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-line bg-paper p-4">
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Isla</span>
            <select name="island" value={island} onChange={(e) => setIsland(e.target.value)} className="field">
              {ISLANDS.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.id === "baleares" ? "Todas / Baleares" : i.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Sección</span>
            <select name="section" value={section} onChange={(e) => setSection(e.target.value)} className="field">
              {SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="breaking" defaultChecked={article?.breaking} className="mt-1" />
            <span>
              <strong className="text-live">Última hora</strong>: aparece en la cinta roja durante 24 horas.
            </span>
          </label>
        </div>

        <div className="space-y-3 rounded-lg border border-line bg-paper p-4">
          <p className="text-sm font-semibold">Foto</p>
          {photo ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="aspect-[3/2] w-full rounded object-cover" />
              <div className="flex gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost flex-1 text-sm">
                  Cambiar
                </button>
                <button type="button" onClick={() => setPhoto(null)} className="btn btn-ghost flex-1 text-sm">
                  Quitar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="grid aspect-[3/2] w-full place-items-center rounded border-2 border-dashed border-line text-sm text-muted hover:border-sea hover:text-sea"
            >
              {uploading ? "Subiendo…" : "📷 Hacer o subir foto"}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
          {uploadError && <p className="text-sm text-live">{uploadError}</p>}

          <input type="hidden" name="photoUrl" value={photo?.url ?? ""} />
          <input type="hidden" name="photoPath" value={photo?.path ?? ""} />
          <input type="hidden" name="photoWidth" value={photo?.width ?? 0} />
          <input type="hidden" name="photoHeight" value={photo?.height ?? 0} />

          <div className={photo ? "space-y-3" : "hidden"}>
            <label className="block space-y-1">
              <span className="text-sm">Qué se ve en la foto</span>
              <input name="photoAlt" defaultValue={article?.photo?.alt} placeholder="Ej.: Retenciones en la Ma-13 a la altura de Inca" className="field" />
            </label>
            <label className="block space-y-1">
              <span className="text-sm">De dónde sale</span>
              <select name="photoLicense" value={license} onChange={(e) => setLicense(e.target.value as PhotoLicense)} className="field">
                {Object.entries(PHOTO_LICENSES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm">Autor o entidad {PHOTO_LICENSES[license].needsAuthor ? "(obligatorio)" : "(opcional)"}</span>
              <input
                name="photoAuthor"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder={license === "press" ? "Ej.: Guardia Civil de Baleares" : "Ej.: Joan Pérez"}
                className="field"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm">Enlace al original (opcional)</span>
              <input name="photoSourceUrl" type="url" defaultValue={article?.photo?.sourceUrl} placeholder="https://…" className="field" />
            </label>
            <p className="text-xs text-muted">Se mostrará: «{photoCredit({ license, author })}»</p>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-line bg-paper p-4">
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Firma</span>
            <input name="authorName" defaultValue={article?.authorName ?? defaultAuthor} className="field" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Fuentes</span>
            <textarea
              name="sources"
              rows={3}
              defaultValue={article?.sources.map((s) => `${s.name} | ${s.url}`).join("\n")}
              placeholder={"Guardia Civil | https://…\nhttps://www.caib.es/…"}
              className="field text-sm"
            />
            <span className="text-xs text-muted">Una por línea. Dan credibilidad ante Google.</span>
          </label>
        </div>
      </aside>
    </form>
  );
}

export function DeleteButton() {
  return (
    <button
      className="btn btn-danger"
      onClick={(e) => {
        if (!confirm("¿Eliminar esta noticia para siempre?")) e.preventDefault();
      }}
    >
      Eliminar noticia
    </button>
  );
}
