export function DemoBadge({ label = "Demo", title }: { label?: string; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex h-5 items-center rounded-xs border border-dashed border-line-strong px-1.5 font-mono text-[10px] uppercase tracking-wider text-muted"
    >
      {label}
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center rounded-xs bg-surface px-2 text-[12px] text-ink-2">{children}</span>
  );
}
