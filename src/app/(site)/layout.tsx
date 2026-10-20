import { BreakingBar } from "@/components/site/BreakingBar";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getBreaking } from "@/lib/content";
import { adsActive, getSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, breaking] = await Promise.all([getSettings(), getBreaking()]);
  return (
    <>
      {/* AdSense (anuncios automáticos y bloques manuales). React lo coloca en <head>.
          El aviso de cookies lo muestra Google con su CMP certificada
          (AdSense → Privacidad y mensajes → RGPD). */}
      {adsActive(s) && (
        <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${s.adsenseClient}`} crossOrigin="anonymous" />
      )}
      <Header siteName={s.siteName} tagline={s.tagline} />
      <BreakingBar items={breaking} />
      <main className="container-x py-8">{children}</main>
      <Footer siteName={s.siteName} tagline={s.tagline} />
    </>
  );
}
