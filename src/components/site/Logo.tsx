import Link from "next/link";

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="3" fill="currentColor" />
      <path d="M13.6 3.5 6.8 13.2h4.6l-1.1 7.3 6.9-9.9h-4.7l1.1-7.1Z" fill="#fff" />
    </svg>
  );
}

export function Logo({ name, className = "" }: { name: string; className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2 ${className}`} aria-label={`${name}, ir a la portada`}>
      <LogoMark className="size-[22px] text-ink transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-rotate-6" />
      <span className="text-[21px] font-bold leading-none tracking-[-0.045em] lowercase">{name}</span>
    </Link>
  );
}
