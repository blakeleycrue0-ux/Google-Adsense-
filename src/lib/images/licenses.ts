import type { ImageMeta, LicenseCode } from "@/lib/types";

/**
 * Política de licencias. Voltio es un medio con publicidad (uso comercial) que
 * redimensiona y recorta las imágenes, por lo que se descartan las licencias
 * «NC» (no comercial) y «ND» (sin obras derivadas), y cualquier imagen cuya
 * licencia no se pueda determinar.
 */
export const LICENSES: Record<
  LicenseCode,
  { name: string; url?: string; usable: boolean; attribution: boolean; reason?: string }
> = {
  own: { name: "Imagen propia", usable: true, attribution: false },
  cc0: { name: "CC0 1.0 (dominio público)", url: "https://creativecommons.org/publicdomain/zero/1.0/deed.es", usable: true, attribution: false },
  pdm: { name: "Dominio público", url: "https://creativecommons.org/publicdomain/mark/1.0/deed.es", usable: true, attribution: false },
  "cc-by": { name: "CC BY", url: "https://creativecommons.org/licenses/by/4.0/deed.es", usable: true, attribution: true },
  "cc-by-sa": { name: "CC BY-SA", url: "https://creativecommons.org/licenses/by-sa/4.0/deed.es", usable: true, attribution: true },
  pexels: { name: "Licencia de Pexels", url: "https://www.pexels.com/es-es/licencia/", usable: true, attribution: true },
  press: { name: "Imagen de prensa (con permiso)", usable: true, attribution: true },
  retailer: { name: "Imagen de tienda / programa de afiliación", usable: true, attribution: false },
  "cc-by-nc": { name: "CC BY-NC", usable: false, attribution: true, reason: "No permite uso comercial (la web tiene publicidad)." },
  "cc-by-nc-sa": { name: "CC BY-NC-SA", usable: false, attribution: true, reason: "No permite uso comercial (la web tiene publicidad)." },
  "cc-by-nc-nd": { name: "CC BY-NC-ND", usable: false, attribution: true, reason: "No permite uso comercial ni recortes." },
  "cc-by-nd": { name: "CC BY-ND", usable: false, attribution: true, reason: "No permite obras derivadas (recortes o adaptaciones)." },
  unknown: { name: "Licencia desconocida", usable: false, attribution: true, reason: "No se ha podido verificar la licencia." },
};

/** Normaliza el nombre de licencia de Commons/Openverse a un código interno. */
export function licenseFromText(raw: string | undefined, version?: string): { code: LicenseCode; name: string } {
  const t = (raw ?? "").toLowerCase().replace(/[_\s]+/g, "-").trim();
  const v = version ? ` ${version}` : "";
  const name = (code: LicenseCode, label?: string) => ({ code, name: label ?? `${LICENSES[code].name}${v}` });
  if (!t) return name("unknown");
  if (t === "cc0" || t.startsWith("cc0") || t.includes("cc-zero")) return name("cc0", "CC0");
  if (t === "pdm" || t.includes("public-domain") || t === "pd" || t.startsWith("pd-")) return name("pdm", "Dominio público");
  const m = t.match(/(?:cc-)?by(-nc)?(-sa)?(-nd)?(?:-(\d(?:\.\d)?))?/);
  if (m && (t.startsWith("cc-by") || t.startsWith("by"))) {
    const ver = m[4] ? ` ${m[4]}` : v;
    const nc = Boolean(m[1]);
    const sa = Boolean(m[2]);
    const nd = Boolean(m[3]);
    const code: LicenseCode = nc ? (nd ? "cc-by-nc-nd" : sa ? "cc-by-nc-sa" : "cc-by-nc") : nd ? "cc-by-nd" : sa ? "cc-by-sa" : "cc-by";
    return { code, name: `${LICENSES[code].name}${ver}` };
  }
  return name("unknown", raw);
}

export function isUsable(code: LicenseCode) {
  return LICENSES[code].usable;
}

/** Texto de atribución que se muestra junto a la imagen y en la página de créditos. */
export function attributionText(meta: Pick<ImageMeta, "author" | "licenseName" | "provider" | "license">) {
  const via: Record<string, string> = {
    openverse: "Openverse",
    pexels: "Pexels",
    press: "prensa",
    feed: "fuente",
  };
  const parts = [meta.author ? `Foto: ${meta.author}` : null, via[meta.provider] ? `vía ${via[meta.provider]}` : null];
  if (LICENSES[meta.license]?.attribution || meta.license.startsWith("cc")) parts.push(meta.licenseName);
  return parts.filter(Boolean).join(" · ");
}
