"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { photoCredit } from "@/lib/photos";
import { CATEGORIES, DIFFICULTIES, PHOTO_LICENSES, type PhotoLicense } from "@/lib/site";
import type { Recipe } from "@/lib/types";
import { checkAiDraft, saveRecipe, startAiDraft, suggestFreePhoto, uploadPhoto, type AiResult } from "./actions";

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

export function Editor({ recipe, defaultAuthor, aiEnabled, flash }: { recipe: Recipe | null; defaultAuthor: string; aiEnabled: boolean; flash?: string }) {
  const [state, action, saving] = useActionState(saveRecipe, flash ? { ok: true, message: flash } : null);
  // Campos que puede rellenar el asistente.
  const [title, setTitle] = useState(recipe?.title ?? "");
  const [summary, setSummary] = useState(recipe?.summary ?? "");
  const [ingredients, setIngredients] = useState(recipe?.ingredients.join("\n") ?? "");
  const [steps, setSteps] = useState(recipe?.steps.join("\n") ?? "");
  const [tips, setTips] = useState(recipe?.tips ?? "");
  const [prep, setPrep] = useState(String(recipe?.prepMinutes || ""));
  const [cook, setCook] = useState(String(recipe?.cookMinutes || ""));
  const [servings, setServings] = useState(recipe?.servings ?? "");
  const [category, setCategory] = useState<string>(recipe?.category ?? "entrantes");

  const [photo, setPhoto] = useState<UploadedPhoto | null>(
    recipe?.photo ? { url: recipe.photo.url, path: recipe.photo.path ?? "", width: recipe.photo.width, height: recipe.photo.height } : null,
  );
  const [license, setLicense] = useState<PhotoLicense>(recipe?.photo?.license ?? "own");
  const [author, setAuthor] = useState(recipe?.photo?.author ?? "");
  const [sourceUrl, setSourceUrl] = useState(recipe?.photo?.sourceUrl ?? "");
  const [tried, setTried] = useState<string[]>(recipe?.photo?.sourceUrl ? [recipe.photo.sourceUrl] : []);
  const [searching, setSearching] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [notes, setNotes] = useState("");
  const [aiOpen, setAiOpen] = useState(!recipe);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  const published = recipe?.status === "published";
  const stepCount = steps.split("\n").filter((l) => l.trim()).length;

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

  async function findPhoto() {
    setUploadError("");
    setSearching(true);
    const res = await suggestFreePhoto(title, tried).catch((e: Error) => ({ ok: false as const, error: e.message }));
    setSearching(false);
    if (!res.ok) return setUploadError(res.error);
    const p = res.photo;
    setPhoto({ url: p.url, path: p.path ?? "", width: p.width, height: p.height });
    setLicense(p.license);
    setAuthor(p.author);
    setSourceUrl(p.sourceUrl ?? "");
    if (p.sourceUrl) setTried((t) => [...t, p.sourceUrl!]);
  }

  async function runAi() {
    setAiError("");
    setAiBusy(true);
    try {
      let res: AiResult | { ok: true; pending: true } = await startAiDraft({ notes, category });
      // En Netlify se hace en segundo plano: se consulta cada 3 s durante 3 minutos.
      for (let i = 0; res.ok && "jobId" in res && i < 60; i++) {
        await sleep(3000);
        const jobId: string = res.jobId;
        const check = await checkAiDraft(jobId);
        res = check.ok && "pending" in check ? { ok: true, jobId } : check;
      }
      if (!res.ok) return setAiError(res.error);
      if (!("draft" in res)) return setAiError("El asistente está tardando demasiado. Inténtalo de nuevo.");
      if ((title || ingredients || steps) && !confirm("¿Sustituir lo que has escrito por la receta ordenada?")) return;
      const d = res.draft;
      setTitle(d.title);
      setSummary(d.summary);
      setIngredients(d.ingredients.join("\n"));
      setSteps(d.steps.join("\n"));
      setTips(d.tips);
      if (d.prepMinutes) setPrep(String(d.prepMinutes));
      if (d.cookMinutes) setCook(String(d.cookMinutes));
      if (d.servings) setServings(d.servings);
      setAiOpen(false);
    } catch {
      setAiError("No se ha podido conectar con el asistente. Inténtalo de nuevo.");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {recipe && <input type="hidden" name="id" value={recipe.id} />}

      <div className="space-y-5">
        {aiEnabled && (
          <section className="rounded-lg border border-line bg-paper">
            <button type="button" onClick={() => setAiOpen((v) => !v)} className="flex w-full items-center justify-between p-4 text-left font-semibold">
              ✨ Ordenar mis apuntes con IA
              <span aria-hidden>{aiOpen ? "−" : "+"}</span>
            </button>
            {aiOpen && (
              <div className="space-y-3 px-4 pb-4">
                <p className="text-sm text-ink-2">
                  Pega tus apuntes de clase o escribe la receta como te salga (ingredientes, cantidades y cómo se hace). El asistente la ordena en
                  ingredientes, pasos y tiempos. <strong>Revísala siempre</strong>: no inventa cantidades y marca con [REVISAR] lo que falte.
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={7}
                  className="field"
                  placeholder="Ej.: Lentejas estofadas para 4. 300 g lentejas pardinas, 1 chorizo, 1 cebolla, 1 pimiento verde, 2 dientes de ajo, pimentón… Sofreír la verdura, añadir el chorizo…"
                />
                {aiError && <p className="text-sm text-live">{aiError}</p>}
                <button type="button" onClick={runAi} disabled={aiBusy || notes.trim().length < 30} className="btn btn-primary">
                  {aiBusy ? "Ordenando… (puede tardar hasta un minuto)" : "Ordenar receta"}
                </button>
              </div>
            )}
          </section>
        )}

        <label className="block space-y-1">
          <span className="text-sm font-semibold">Nombre de la receta</span>
          <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="Ej.: Lentejas estofadas con chorizo" className="field text-lg font-semibold" />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">Presentación</span>
          <textarea name="summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} maxLength={500} className="field" />
          <span className="text-xs text-muted">1-2 frases sobre el plato. Es lo que se ve en Google y al compartir el enlace.</span>
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Preparación</span>
            <div className="flex items-center gap-1.5">
              <input name="prepMinutes" value={prep} onChange={(e) => setPrep(e.target.value)} inputMode="numeric" className="field" />
              <span className="text-sm text-muted">min</span>
            </div>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Cocción</span>
            <div className="flex items-center gap-1.5">
              <input name="cookMinutes" value={cook} onChange={(e) => setCook(e.target.value)} inputMode="numeric" className="field" />
              <span className="text-sm text-muted">min</span>
            </div>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Raciones</span>
            <input name="servings" value={servings} onChange={(e) => setServings(e.target.value)} placeholder="4 personas" className="field" />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">Ingredientes</span>
          <textarea
            name="ingredients"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={10}
            placeholder={"300 g de lentejas pardinas\n1 cebolla\n# Para el sofrito\n2 dientes de ajo"}
            className="field"
          />
          <span className="text-xs text-muted">Uno por línea, con la cantidad. Para separar partes, escribe una línea que empiece por # (# Para la salsa).</span>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">Elaboración</span>
          <textarea name="steps" value={steps} onChange={(e) => setSteps(e.target.value)} rows={12} className="field leading-relaxed" />
          <span className="text-xs text-muted">Un paso por línea ({stepCount} {stepCount === 1 ? "paso" : "pasos"}). Se numeran solos.</span>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">Consejos (opcional)</span>
          <textarea name="tips" value={tips} onChange={(e) => setTips(e.target.value)} rows={4} placeholder="Trucos, variantes, cómo conservarla…" className="field" />
        </label>
      </div>

      <aside className="space-y-5">
        <div className="space-y-3 rounded-lg border border-line bg-paper p-4 lg:sticky lg:top-4">
          <p className="text-sm">
            Estado: <strong>{published ? "Publicada en la web" : recipe ? "Privada (solo tú)" : "Sin guardar"}</strong>
          </p>
          {state && <p className={`rounded p-2 text-sm ${state.ok ? "bg-[#e7f6ec] text-ok" : "bg-[#fdecea] text-live"}`}>{state.message}</p>}
          <div className="flex flex-wrap gap-2">
            <button name="intent" value="publish" disabled={saving || uploading} className="btn btn-primary flex-1">
              {published ? "Guardar cambios" : "Publicar"}
            </button>
            <button name="intent" value="private" disabled={saving || uploading} className="btn btn-ghost flex-1">
              {published ? "Pasar a privada" : "Guardar privada"}
            </button>
          </div>
          <p className="text-xs text-muted">Las privadas no salen en la web ni en Google: solo las ves tú aquí.</p>
        </div>

        <div className="space-y-3 rounded-lg border border-line bg-paper p-4">
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Categoría</span>
            <select name="category" value={category} onChange={(e) => setCategory(e.target.value)} className="field">
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Dificultad</span>
            <select name="difficulty" defaultValue={recipe?.difficulty ?? "facil"} className="field">
              {DIFFICULTIES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Etiquetas</span>
            <input name="tags" defaultValue={recipe?.tags.join(", ")} placeholder="legumbres, invierno, sin gluten" className="field" />
            <span className="text-xs text-muted">Separadas por comas. Ayudan al buscador.</span>
          </label>
        </div>

        <div className="space-y-3 rounded-lg border border-line bg-paper p-4">
          <p className="text-sm font-semibold">Foto del plato</p>
          {photo ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="aspect-[4/3] w-full rounded object-cover" />
              <div className="flex gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost flex-1 text-sm">
                  Cambiar
                </button>
                <button type="button" onClick={findPhoto} disabled={searching} className="btn btn-ghost flex-1 text-sm">
                  {searching ? "Buscando…" : "Otra foto"}
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
              className="grid aspect-[4/3] w-full place-items-center rounded border-2 border-dashed border-line text-sm text-muted hover:border-ink hover:text-ink"
            >
              {uploading ? "Subiendo…" : "📷 Hacer o subir foto"}
            </button>
          )}
          {!photo && (
            <button type="button" onClick={findPhoto} disabled={searching} className="btn btn-ghost w-full text-sm">
              {searching ? "Buscando foto…" : "🔎 Buscar foto profesional (Pexels)"}
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
              <span className="text-sm">Qué se ve (opcional)</span>
              <input name="photoAlt" defaultValue={recipe?.photo?.alt} placeholder="Plato de lentejas con chorizo" className="field" />
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
            {license !== "own" && (
              <>
                <label className="block space-y-1">
                  <span className="text-sm">Autor (obligatorio)</span>
                  <input name="photoAuthor" value={author} onChange={(e) => setAuthor(e.target.value)} className="field" />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm">Enlace al original (opcional)</span>
                  <input name="photoSourceUrl" type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" className="field" />
                </label>
              </>
            )}
            {license === "own" && (
              <>
                <input type="hidden" name="photoAuthor" value="" />
                <input type="hidden" name="photoSourceUrl" value="" />
              </>
            )}
            <p className="text-xs text-muted">Se mostrará: «{photoCredit({ license, author: license === "own" ? "" : author })}»</p>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-paper p-4">
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Firma (opcional)</span>
            <input name="authorName" defaultValue={recipe ? recipe.authorName : defaultAuthor} className="field" />
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
        if (!confirm("¿Eliminar esta receta para siempre?")) e.preventDefault();
      }}
    >
      Eliminar receta
    </button>
  );
}
