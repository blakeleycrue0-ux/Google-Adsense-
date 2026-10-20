const TZ = "Europe/Madrid";

const dayKey = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("es-ES", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-ES", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

export function formatLongDate(d = new Date()) {
  return new Intl.DateTimeFormat("es-ES", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
}

/** «Hoy, 14:05», «Ayer, 18:20» o «17 de octubre de 2026, 09:10». */
export function formatSmart(iso: string, now = new Date()) {
  const k = dayKey(new Date(iso));
  const time = formatTime(iso);
  if (k === dayKey(now)) return `Hoy, ${time}`;
  if (k === dayKey(new Date(now.getTime() - 86400_000))) return `Ayer, ${time}`;
  return `${formatDate(iso)}, ${time}`;
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/, "");
}

export function normalizeText(input: string) {
  return input.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function readingMinutes(markdown: string) {
  return Math.max(1, Math.round(markdown.split(/\s+/).filter(Boolean).length / 220));
}
