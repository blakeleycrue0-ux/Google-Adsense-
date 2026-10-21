/** Puntuación de «foto luminosa y limpia» a partir del color medio. */
export function brightScore(hex: string | null, rank: number) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex ?? "");
  if (!m) return -rank;
  const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16) / 255);
  const light = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const saturation = Math.max(r, g, b) - Math.min(r, g, b);
  // Luminosa y poco saturada; los primeros resultados (más relevantes) tienen ventaja.
  return light * 10 - saturation * 4 - rank * 0.35;
}
