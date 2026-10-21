import { requireUser } from "@/lib/auth";
import { pixabayKey } from "@/lib/free-photos";
import { getSettings } from "@/lib/settings";
import { PasswordForm, SettingsForm } from "./SettingsForms";

export default async function SettingsPage() {
  await requireUser();
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Ajustes</h1>
      {/* La clave de fotos no se manda al navegador: solo si está puesta. */}
      <SettingsForm s={{ ...s, pixabayKey: "" }} photoKeySet={Boolean(await pixabayKey())} />
      <PasswordForm />
    </div>
  );
}
