import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { getSettings, validAdsenseClient } from "@/lib/settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(s.siteUrl),
    title: { default: `${s.siteName} · ${s.tagline}`, template: `%s · ${s.siteName}` },
    description: `${s.tagline}. Sucesos, tráfico, tiempo, política, sociedad y agenda de las Islas Baleares.`,
    applicationName: s.siteName,
    alternates: { types: { "application/rss+xml": "/feed.xml" } },
    robots: { index: true, follow: true, "max-image-preview": "large" },
    verification: s.searchConsoleVerification ? { google: s.searchConsoleVerification } : undefined,
    openGraph: { siteName: s.siteName, locale: "es_ES", type: "website" },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
    // Etiqueta con la que AdSense verifica que la web es tuya.
    other: validAdsenseClient(s.adsenseClient) ? { "google-adsense-account": s.adsenseClient } : undefined,
  };
}

export const viewport: Viewport = {
  themeColor: "#0b5c8a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
