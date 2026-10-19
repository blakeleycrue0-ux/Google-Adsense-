/**
 * Busca fotos reales con licencia para los artículos y fichas que aún usan una
 * ilustración, durante la compilación en Netlify (allí hay acceso a Openverse).
 * Las fotos elegidas se guardan en public/fotos y src/data/auto-photos.json, y
 * la web las sirve como cualquier otro recurso estático: no depende de ningún
 * almacenamiento en tiempo de ejecución.
 *
 * Controles (los mismos que la publicación automática del panel): licencia que
 * permite uso comercial y modificación, modelo exacto en móviles, tema claro en
 * artículos y resolución suficiente. Si nada los supera, se mantiene la ilustración.
 *
 * Se ejecuta con: node --conditions=react-server --import tsx scripts/fotos.ts
 * Solo actúa en Netlify o con VOLTIO_FOTOS=1. Nunca hace fallar la compilación.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { phones } from "@/data/seed/phones";
import { posts } from "@/data/seed/posts";
import { metaFromCandidate } from "@/lib/images/import";
import { attributionText } from "@/lib/images/licenses";
import { providerInfo, searchProvider } from "@/lib/images/providers";
import { AUTO_APPROVER, keywordsFor, publishable, queryFor, scoreCandidate, type ScoreTarget } from "@/lib/images/scoring";
import type { ImageRef } from "@/lib/types";

const ROOT = process.cwd();
// .next/cache se conserva entre compilaciones en Netlify: no se repiten búsquedas ni descargas.
const CACHE = path.join(ROOT, ".next/cache/voltio-fotos-v2");
const PUBLIC = path.join(ROOT, "public/fotos");
const OUT = path.join(ROOT, "src/data/auto-photos.json");
// Lo lee el plugin netlify/plugins/voltio-fotos para mostrarlo en el resumen del despliegue.
const REPORT = path.join(ROOT, ".netlify/voltio-fotos.json");
const MAX_BYTES = 20 * 1024 * 1024;

type Entry = { ref: ImageRef; file: string } | { none: true; checkedAt: string };
type Index = Record<string, Entry>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function readIndex(): Promise<Index> {
  try {
    return JSON.parse(await fs.readFile(path.join(CACHE, "index.json"), "utf8")) as Index;
  } catch {
    return {};
  }
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { "User-Agent": "VoltioImageBot/1.0 (+https://voltio0.netlify.app)" }, signal: AbortSignal.timeout(25_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (!(res.headers.get("content-type") ?? "").startsWith("image/")) throw new Error("No es una imagen");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_BYTES) throw new Error("Imagen demasiado grande");
  return buf;
}

async function main() {
  if (!process.env.NETLIFY && process.env.VOLTIO_FOTOS !== "1") {
    console.log("[fotos] Fuera de Netlify: se omite (usa VOLTIO_FOTOS=1 para forzarlo).");
    return;
  }
  await fs.mkdir(CACHE, { recursive: true });
  await fs.mkdir(PUBLIC, { recursive: true });
  const index = await readIndex();
  const providers = providerInfo().filter((p) => p.configured).map((p) => p.id);

  const targets: { key: string; alt: string; t: ScoreTarget }[] = [
    ...posts.filter((p) => p.cover.illustrative).map((p) => ({ key: `post:${p.id}`, alt: p.cover.alt || p.title, t: { type: "post", post: p } as ScoreTarget })),
    ...phones.filter((p) => p.image.illustrative).map((p) => ({ key: `phone:${p.id}`, alt: `${p.brand} ${p.model}`, t: { type: "phone", phone: p } as ScoreTarget })),
  ];

  let found = 0;
  const lines: string[] = [];
  const log = (msg: string) => {
    console.log(`[fotos] ${msg}`);
    lines.push(msg);
  };
  let limited = false;
  for (const { key, alt, t } of targets) {
    const prev = index[key];
    // Ya resuelta, o sin resultado hace menos de 3 días: no se repite.
    if (prev && "ref" in prev) continue;
    if (prev && "none" in prev && Date.now() - Date.parse(prev.checkedAt) < 3 * 86400_000) continue;
    if (limited) break;

    const kind = t.type === "phone" ? "phone" : "cover";
    const query = queryFor(t);
    const keywords = keywordsFor(t, query);
    const candidates = [];
    let failed = false;
    for (const p of providers) {
      try {
        candidates.push(...(await searchProvider(p, query, { kind, perPage: 20 })));
      } catch (e) {
        const msg = (e as Error).message;
        log(`${key} · ${p}: ${msg}`);
        failed = true;
        if (msg.includes("429")) limited = true;
      }
      await sleep(1_500); // Respeta el límite de peticiones anónimas de Openverse.
    }

    const best = publishable(candidates.map((c) => scoreCandidate(c, t, keywords)), kind).slice(0, 3);
    let done = false;
    for (const c of best) {
      try {
        const img = sharp(await download(c.fullUrl), { failOn: "none" }).rotate();
        const { data, info } = await img
          .resize({ width: kind === "cover" ? 1600 : 900, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer({ resolveWithObject: true });
        const file = `${key.replace(":", "-")}.webp`;
        await fs.writeFile(path.join(CACHE, file), data);
        const meta = metaFromCandidate(c, AUTO_APPROVER);
        index[key] = { file, ref: { src: `/fotos/${file}`, alt, width: info.width, height: info.height, credit: attributionText(meta), meta } };
        log(`${key} ← «${c.title}» (${c.licenseName}, ${c.author ?? "autor desconocido"})`);
        found++;
        done = true;
        break;
      } catch (e) {
        log(`${key}: no se pudo descargar ${c.fullUrl}: ${(e as Error).message}`);
      }
    }
    // Solo se anota «sin foto» si la búsqueda funcionó; un fallo de red se reintenta en la próxima compilación.
    if (!done && !failed) {
      index[key] = { none: true, checkedAt: new Date().toISOString() };
      const near = candidates.length ? ` · ${candidates.length} resultados, mejor: «${candidates.map((c) => scoreCandidate(c, t, keywords)).sort((a, b) => b.score - a.score)[0].title}»` : " · sin resultados";
      log(`${key}: ninguna supera los controles («${query}»)${near}`);
    }
  }

  await fs.writeFile(path.join(CACHE, "index.json"), JSON.stringify(index, null, 2));
  const out: Record<string, ImageRef> = {};
  for (const [key, entry] of Object.entries(index)) {
    if (!("ref" in entry)) continue;
    await fs.copyFile(path.join(CACHE, entry.file), path.join(PUBLIC, entry.file));
    out[key] = entry.ref;
  }
  await fs.writeFile(OUT, JSON.stringify(out, null, 2) + "\n");
  const summary = `${found} nuevas · ${Object.keys(out).length} fotos reales en total de ${targets.length} contenidos con ilustración${limited ? " · límite de Openverse alcanzado, se continúa en la próxima compilación" : ""}`;
  console.log(`[fotos] ${summary}`);
  await fs.mkdir(path.dirname(REPORT), { recursive: true });
  await fs.writeFile(REPORT, JSON.stringify({ summary, lines }, null, 2));
}

main().catch((e) => {
  console.log(`[fotos] Error (la compilación continúa): ${(e as Error).message}`);
});
