import { ArrowUpRight } from "@/components/ui/Icons";

/**
 * Enlace de compra. Pasa siempre por /go/[id] para aplicar el código de
 * afiliado configurado y contar el clic. Marcado como `sponsored`.
 */
export function BuyLink({
  linkId,
  children,
  variant = "primary",
  className = "",
}: {
  linkId: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "inline";
  className?: string;
}) {
  const cls =
    variant === "inline"
      ? "inline-flex items-center gap-1 font-medium underline decoration-line-strong underline-offset-4 hover:decoration-ink"
      : variant === "primary"
        ? "btn-primary"
        : "btn-secondary";
  return (
    <a href={`/go/${linkId}`} target="_blank" rel="sponsored nofollow noopener" className={`${cls} ${className}`}>
      {children}
      <ArrowUpRight width={15} height={15} />
    </a>
  );
}
