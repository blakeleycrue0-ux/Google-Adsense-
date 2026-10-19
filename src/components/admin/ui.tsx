import Link from "next/link";

export function AdminPage({
  title,
  description,
  actions,
  back,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      {back && (
        <Link href={back.href} className="text-[13px] text-muted hover:text-ink">
          ← {back.label}
        </Link>
      )}
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.03em]">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-[14px] text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}

export function Panel({ title, description, children, className = "" }: { title?: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-md border border-line bg-paper ${className}`}>
      {title && (
        <header className="border-b border-line px-5 py-3.5">
          <h2 className="text-[14px] font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-[12px] text-muted">{description}</p>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[12px] leading-snug text-muted">{hint}</span>}
    </label>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    published: ["Publicado", "bg-ink text-paper"],
    scheduled: ["Programado", "border border-ink text-ink"],
    draft: ["Borrador", "bg-surface text-ink-2"],
    review: ["En revisión", "border border-dashed border-ink-2 text-ink-2"],
    new: ["Nuevo", "bg-ink text-paper"],
    drafted: ["Borrador creado", "bg-surface text-ink-2"],
    discarded: ["Descartado", "bg-surface text-faint"],
  };
  const [label, cls] = map[status] ?? [status, "bg-surface"];
  return <span className={`inline-flex h-5 items-center whitespace-nowrap rounded-xs px-1.5 text-[11px] font-medium ${cls}`}>{label}</span>;
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-line-strong px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-[14px] text-muted">{children}</div>}
    </div>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="w-full min-w-[640px] text-left text-[14px] [&_td]:border-t [&_td]:border-line [&_td]:px-4 [&_td]:py-3 [&_th]:bg-surface [&_th]:px-4 [&_th]:py-2.5 [&_th]:font-mono [&_th]:text-[11px] [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-muted">
        {children}
      </table>
    </div>
  );
}
