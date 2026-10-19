"use client";

import { openConsentPreferences } from "./consent-store";

export function ConsentPreferencesLink() {
  return (
    <button type="button" onClick={openConsentPreferences} className="text-left underline-offset-4 hover:text-ink hover:underline">
      Preferencias de privacidad
    </button>
  );
}
