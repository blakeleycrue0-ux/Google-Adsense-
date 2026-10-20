"use client";

import { useActionState } from "react";
import { login, setupAdmin } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Correo</span>
        <input name="email" type="email" required autoComplete="username" className="field" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Contraseña</span>
        <input name="password" type="password" required autoComplete="current-password" className="field" />
      </label>
      {state?.error && <p className="text-sm text-live">{state.error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

export function SetupForm({ needsToken }: { needsToken: boolean }) {
  const [state, action, pending] = useActionState(setupAdmin, null);
  return (
    <form action={action} className="space-y-4">
      <p className="rounded-md bg-surface p-3 text-sm text-ink-2">Aún no hay ninguna cuenta. Crea la tuya para empezar a publicar.</p>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Tu nombre (aparecerá como autor)</span>
        <input name="name" required className="field" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Correo</span>
        <input name="email" type="email" required autoComplete="username" className="field" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Contraseña (mínimo 10 caracteres)</span>
        <input name="password" type="password" required minLength={10} autoComplete="new-password" className="field" />
      </label>
      {needsToken && (
        <label className="block space-y-1">
          <span className="text-sm font-medium">Código de configuración</span>
          <input name="token" required className="field" />
        </label>
      )}
      {state?.error && <p className="text-sm text-live">{state.error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Creando…" : "Crear cuenta"}
      </button>
    </form>
  );
}
