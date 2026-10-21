"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { autoPhoto } from "./actions";

type Item = { id: string; title: string };

/** Pone fotos libres (Wikimedia Commons) a las recetas privadas sin foto, de dos en dos. */
export function AutoPhotos({ items }: { items: Item[] }) {
  const router = useRouter();
  const [publish, setPublish] = useState(true);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [published, setPublished] = useState(0);
  const [failed, setFailed] = useState<(Item & { error: string })[]>([]);

  async function run() {
    setRunning(true);
    setDone(0);
    setPublished(0);
    setFailed([]);
    const queue = [...items];
    const worker = async () => {
      for (let item = queue.shift(); item; item = queue.shift()) {
        const res = await autoPhoto(item.id, publish).catch((e: Error) => ({ ok: false as const, error: e.message }));
        if (res.ok && res.published) setPublished((n) => n + 1);
        if (!res.ok) setFailed((f) => [...f, { ...item, error: res.error }]);
        setDone((n) => n + 1);
      }
    };
    await Promise.all([worker(), worker()]);
    setRunning(false);
    router.refresh();
  }

  return (
    <section className="space-y-3 rounded-lg border border-line bg-paper p-4">
      <p className="text-sm text-ink-2">
        <strong className="text-ink">
          📷 {items.length} {items.length === 1 ? "receta privada sin foto" : "recetas privadas sin foto"}.
        </strong>{" "}
        Les busco una foto con licencia libre en Wikimedia Commons (con su autor y enlace, como exige la licencia). Luego puedes cambiar la que no te
        guste desde cada receta.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} disabled={running} />
        Publicarlas en cuanto tengan foto
      </label>
      <button onClick={run} disabled={running} className="btn btn-primary">
        {running ? `Buscando fotos… ${done}/${items.length}` : "Poner fotos automáticamente"}
      </button>
      {!running && done > 0 && (
        <p className="text-sm text-ok">
          Listo: {done - failed.length} con foto{published ? `, ${published} publicadas` : ""}.
        </p>
      )}
      {failed.length > 0 && (
        <ul className="space-y-1 text-sm text-muted">
          {failed.map((f) => (
            <li key={f.id}>
              <a href={`/admin/receta/${f.id}`} className="underline underline-offset-2">
                {f.title}
              </a>
              : {f.error}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
