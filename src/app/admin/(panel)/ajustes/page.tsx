import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PasswordForm, SettingsForm } from "./SettingsForms";

export default async function SettingsPage() {
  await requireUser();
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Ajustes</h1>
      <SettingsForm s={s} />
      <PasswordForm />
    </div>
  );
}
