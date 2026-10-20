import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { CollectionName, Collections, Settings } from "@/lib/types";
import type { DataAdapter } from "./adapter";

const DATA_DIR = path.resolve(process.env.DATA_DIR || "./data");
// Las subidas se sirven mediante /uploads/[...path] (Next.js no sirve lo que se
// añade a public/ después de compilar).
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

// Cola de escrituras por fichero para evitar condiciones de carrera dentro del proceso.
const locks = new Map<string, Promise<unknown>>();
function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(
    key,
    next.catch(() => undefined),
  );
  return next;
}

async function readJson<T>(file: string): Promise<T | undefined> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw err;
  }
}

async function writeJson(file: string, value: unknown) {
  try {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(value, null, 2));
    await fs.rename(tmp, file);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "EROFS" || code === "EACCES") {
      throw new Error("El disco de este servidor es de solo lectura. Publica la web en Netlify para guardar cambios.");
    }
    throw err;
  }
}

const fileFor = (name: string) => path.join(DATA_DIR, `${name}.json`);

function uploadTarget(rel: string) {
  const target = path.join(UPLOAD_DIR, rel);
  return target.startsWith(UPLOAD_DIR + path.sep) ? target : null;
}

export class FileAdapter implements DataAdapter {
  readonly kind = "file" as const;

  async list<K extends CollectionName>(collection: K): Promise<Collections[K][]> {
    return (await readJson<Collections[K][]>(fileFor(collection))) ?? [];
  }

  async get<K extends CollectionName>(collection: K, id: string) {
    return (await this.list(collection)).find((d) => d.id === id) ?? null;
  }

  put<K extends CollectionName>(collection: K, doc: Collections[K]) {
    return withLock(collection, async () => {
      const all = await this.list(collection);
      const i = all.findIndex((d) => d.id === doc.id);
      if (i >= 0) all[i] = doc;
      else all.push(doc);
      await writeJson(fileFor(collection), all);
    });
  }

  remove<K extends CollectionName>(collection: K, id: string) {
    return withLock(collection, async () => {
      const all = await this.list(collection);
      await writeJson(
        fileFor(collection),
        all.filter((d) => d.id !== id),
      );
    });
  }

  async getSettings() {
    return (await readJson<Partial<Settings>>(fileFor("settings"))) ?? null;
  }

  saveSettings(settings: Settings) {
    return withLock("settings", () => writeJson(fileFor("settings"), settings));
  }

  async uploadFile(rel: string, data: Buffer) {
    const target = uploadTarget(rel);
    if (!target) throw new Error("Ruta de archivo no válida");
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
    return `/uploads/${rel}`;
  }

  async deleteFile(rel: string) {
    const target = uploadTarget(rel);
    if (target) await fs.rm(target, { force: true });
  }

  async readUpload(rel: string) {
    const target = uploadTarget(rel);
    if (!target) return null;
    try {
      const buf = await fs.readFile(target);
      return { data: new Uint8Array(buf), mime: "image/webp" };
    } catch {
      return null;
    }
  }
}
