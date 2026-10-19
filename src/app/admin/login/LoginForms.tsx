"use client";

import { useActionState } from "react";
import { login, setupAdmin, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" autoFocus />
      </div>
      <div>
        <label htmlFor="password" className="label">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      {state?.error && <p role="alert" className="text-[13px] text-live">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</button>
    </form>
  );
}

export function SetupForm({ needsToken }: { needsToken: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(setupAdmin, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name" className="label">Nombre</label>
        <input id="name" name="name" required className="field" autoFocus />
      </div>
      <div>
        <label htmlFor="email" className="label">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" />
      </div>
      <div>
        <label htmlFor="password" className="label">Contraseña (mínimo 12 caracteres)</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required className="field" />
      </div>
      {needsToken && (
        <div>
          <label htmlFor="token" className="label">Token de configuración (ADMIN_SETUP_TOKEN)</label>
          <input id="token" name="token" type="password" required className="field" />
        </div>
      )}
      {state?.error && <p role="alert" className="text-[13px] text-live">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Creando…" : "Crear cuenta de administración"}</button>
    </form>
  );
}
