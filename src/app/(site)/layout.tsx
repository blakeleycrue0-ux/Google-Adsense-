import Script from "next/script";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { DemoNotice } from "@/components/site/DemoNotice";
import { ConsentDefaults } from "@/components/consent/ConsentDefaults";
import { ConsentManager } from "@/components/consent/ConsentManager";
import { adsActive as isAdsActive, getSettings } from "@/lib/settings";
import { CompareTray } from "@/components/phones/CompareTray";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const adsActive = isAdsActive(s);
  return (
    <>
      {s.consent.mode === "builtin" && <ConsentDefaults />}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[80] focus:rounded-sm focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
      >
        Saltar al contenido
      </a>
      {s.demoMode && <DemoNotice />}
      <Header />
      <main id="contenido">{children}</main>
      <Footer />
      <CompareTray />
      <ConsentManager gaId={s.analytics.gaMeasurementId} mode={s.consent.mode} adsEnabled={adsActive} />
      {adsActive && (
        <Script
          id="adsense"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${s.ads.client}`}
        />
      )}
    </>
  );
}
