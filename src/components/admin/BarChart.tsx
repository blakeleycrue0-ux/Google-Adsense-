/** Gráfico de barras minimalista (sin dependencias) para series diarias. */
export function BarChart({ data, label }: { data: { day: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <figure>
      <figcaption className="sr-only">
        {label}: {total} en total
      </figcaption>
      <div className="flex h-36 items-end gap-[3px]" role="img" aria-label={`${label}: ${total} en ${data.length} días`}>
        {data.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-[2px] bg-ink/80 transition-colors group-hover:bg-ink"
              style={{ height: `${Math.max(d.value ? 4 : 1, (d.value / max) * 100)}%`, opacity: d.value ? 1 : 0.15 }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-xs bg-ink px-1.5 py-0.5 font-mono text-[10px] text-paper opacity-0 group-hover:opacity-100">
              {d.day.slice(5)} · {d.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-faint">
        <span>{data[0]?.day.slice(5)}</span>
        <span>{data.at(-1)?.day.slice(5)}</span>
      </div>
    </figure>
  );
}
