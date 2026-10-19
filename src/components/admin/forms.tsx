"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

export type ActionResult = { ok: boolean; message: string; redirectTo?: string } | null;

export function SubmitButton({ children, variant = "primary", className = "", name, value }: { children: React.ReactNode; variant?: "primary" | "secondary"; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={`${variant === "primary" ? "btn-primary" : "btn-secondary"} ${className}`} disabled={pending} name={name} value={value}>
      {pending ? "Guardando…" : children}
    </button>
  );
}

/** Formulario con acción de servidor y mensaje de estado accesible. */
export function ActionForm({
  action,
  children,
  className = "",
}: {
  action: (prev: ActionResult, form: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state?.ok && state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);
  return (
    <form action={formAction} className={className}>
      {children}
      <div ref={ref} role="status" aria-live="polite" className="min-h-[1px]">
        {state && (
          <p
            className={`fixed bottom-5 right-5 z-50 max-w-sm animate-fade-up rounded-sm px-4 py-3 text-[13px] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)] ${
              state.ok ? "bg-ink text-paper" : "border border-live bg-paper text-live"
            }`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

export function ConfirmButton({ children, message = "¿Seguro? Esta acción no se puede deshacer.", className = "btn-ghost btn-sm text-live" }: { children: React.ReactNode; message?: string; className?: string }) {
  return (
    <button
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
