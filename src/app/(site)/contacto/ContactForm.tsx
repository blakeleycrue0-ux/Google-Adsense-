"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendContact, type ContactState } from "./actions";

export function ContactForm({ defaultSubject }: { defaultSubject?: string }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, null);

  if (state?.ok) {
    return (
      <div role="status" className="animate-fade-up rounded-md border border-line p-8">
        <p className="text-[20px] font-semibold tracking-[-0.02em]">✔ {state.message}</p>
        <p className="mt-2 text-[14px] text-muted">Hemos recibido tu mensaje correctamente.</p>
      </div>
    );
  }

  const err = (k: string) =>
    state?.errors?.[k] ? (
      <p id={`${k}-error`} className="mt-1.5 text-[12px] text-live">
        {state.errors[k]}
      </p>
    ) : null;

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">
            Nombre
          </label>
          <input id="name" name="name" className="field" autoComplete="name" required aria-invalid={!!state?.errors?.name} aria-describedby="name-error" />
          {err("name")}
        </div>
        <div>
          <label htmlFor="email" className="label">
            Correo electrónico
          </label>
          <input id="email" name="email" type="email" className="field" autoComplete="email" required aria-invalid={!!state?.errors?.email} aria-describedby="email-error" />
          {err("email")}
        </div>
      </div>
      <div>
        <label htmlFor="subject" className="label">
          Asunto
        </label>
        <input id="subject" name="subject" defaultValue={defaultSubject} className="field" required aria-invalid={!!state?.errors?.subject} aria-describedby="subject-error" />
        {err("subject")}
      </div>
      <div>
        <label htmlFor="message" className="label">
          Mensaje
        </label>
        <textarea id="message" name="message" rows={7} className="field" required aria-invalid={!!state?.errors?.message} aria-describedby="message-error" />
        {err("message")}
      </div>
      <div className="hidden" aria-hidden>
        <label htmlFor="website">No rellenes este campo</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-2">
          <input type="checkbox" name="privacy" className="mt-0.5 size-4 accent-ink" required />
          <span>
            He leído y acepto la{" "}
            <Link href="/legal/privacidad" className="underline underline-offset-2" target="_blank">
              política de privacidad
            </Link>
            . Usaremos tus datos solo para responder a tu mensaje.
          </span>
        </label>
        {err("privacy")}
      </div>
      {state && !state.ok && (
        <p role="alert" className="text-[13px] text-live">
          {state.message}
        </p>
      )}
      <button className="btn-primary" disabled={pending}>
        {pending ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
