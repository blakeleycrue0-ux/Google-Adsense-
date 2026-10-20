"use client";

import { useActionState } from "react";
import type { Settings } from "@/lib/types";
import { changePassword, saveSettings } from "./actions";

function Field({ label, hint, ...props }: { label: string; hint?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold">{label}</span>
      <input className="field" {...props} />
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border border-line bg-paper p-5">
      <h2 className="font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Status({ state }: { state: { ok: boolean; message: string } | null }) {
  if (!state) return null;
  return <p className={`rounded p-2 text-sm ${state.ok ? "bg-[#e7f6ec] text-ok" : "bg-[#fdecea] text-live"}`}>{state.message}</p>;
}

export function SettingsForm({ s }: { s: Settings }) {
  const [state, action, pending] = useActionState(saveSettings, null);
  return (
    <form action={action} className="space-y-6">
      <Card title="La web">
        <Field label="Nombre" name="siteName" defaultValue={s.siteName} required />
        <Field label="Lema" name="tagline" defaultValue={s.tagline} />
        <Field label="Dirección de la web" name="siteUrl" type="url" defaultValue={s.siteUrl} hint="Con tu dominio cuando lo tengas, p. ej. https://www.tudominio.es" />
      </Card>

      <Card title="Sobre mí">
        <label className="block space-y-1">
          <span className="text-sm font-semibold">Texto de la página «Sobre mí»</span>
          <textarea
            name="about"
            defaultValue={s.about}
            rows={6}
            placeholder="Quién eres, por qué cocinas, qué estudias (por ejemplo, FP de cocina)… Google y AdSense valoran saber quién está detrás de la web."
            className="field"
          />
        </label>
        <Field label="Instagram (usuario)" name="instagram" defaultValue={s.instagram} placeholder="tu_usuario" />
        <Field label="TikTok (usuario)" name="tiktok" defaultValue={s.tiktok} placeholder="tu_usuario" />
      </Card>

      <Card title="Titular (aviso legal)">
        <p className="text-sm text-ink-2">La ley (LSSI) obliga a mostrar quién está detrás de la web. AdSense también lo revisa.</p>
        <Field label="Nombre y apellidos o empresa" name="ownerName" defaultValue={s.ownerName} />
        <Field label="NIF / DNI" name="ownerNif" defaultValue={s.ownerNif} />
        <Field label="Domicilio" name="ownerAddress" defaultValue={s.ownerAddress} />
        <Field label="Correo de contacto" name="contactEmail" type="email" defaultValue={s.contactEmail} />
      </Card>

      <Card title="Google AdSense">
        <Field
          label="ID de editor"
          name="adsenseClient"
          defaultValue={s.adsenseClient}
          placeholder="ca-pub-1234567890123456"
          hint="Está en AdSense → Cuenta → Información de la cuenta. Con solo ponerlo, la web ya muestra la etiqueta de verificación y el archivo ads.txt."
        />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="adsEnabled" defaultChecked={s.adsEnabled} className="mt-1" />
          <span>
            <strong>Mostrar anuncios.</strong> Actívalo cuando Google apruebe la web (o mientras la revisa, para que vea el código). Activa también los
            «anuncios automáticos» y el mensaje de privacidad RGPD dentro de AdSense.
          </span>
        </label>
        <details className="text-sm">
          <summary className="cursor-pointer text-sea">Bloques manuales (opcional)</summary>
          <div className="mt-3 space-y-3">
            <p className="text-muted">Si usas solo anuncios automáticos, déjalos vacíos.</p>
            <Field label="Bloque en portada y listados" name="slotHome" defaultValue={s.slots.home} inputMode="numeric" />
            <Field label="Bloque dentro de las recetas" name="slotArticle" defaultValue={s.slots.article} inputMode="numeric" />
          </div>
        </details>
      </Card>

      <Card title="Google Search Console">
        <Field
          label="Código de verificación"
          name="searchConsoleVerification"
          defaultValue={s.searchConsoleVerification}
          hint="Elige el método «Etiqueta HTML» y pega la etiqueta completa o solo el código."
        />
      </Card>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Guardando…" : "Guardar ajustes"}
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null);
  return (
    <form action={action}>
      <Card title="Cambiar contraseña">
        <Field label="Contraseña actual" name="current" type="password" autoComplete="current-password" required />
        <Field label="Nueva contraseña" name="next" type="password" autoComplete="new-password" minLength={10} required />
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost" disabled={pending}>
            Cambiar
          </button>
          <Status state={state} />
        </div>
      </Card>
    </form>
  );
}
