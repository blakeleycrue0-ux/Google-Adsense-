import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { getSettings } from "@/lib/settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(s.siteUrl),
    title: { default: `${s.siteName} · ${s.tagline}`, template: `%s · ${s.siteName}` },
    description:
      "Noticias de tecnología, guías de compra, comparador de móviles y ofertas verificadas. Información con fuentes y sin ruido.",
    applicationName: s.siteName,
    alternates: { types: { "application/rss+xml": "/feed.xml" } },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
    robots: s.demoMode ? { index: false, follow: false } : { index: true, follow: true, "max-image-preview": "large" },
    verification: s.analytics.searchConsoleVerification ? { google: s.analytics.searchConsoleVerification } : undefined,
    openGraph: { siteName: s.siteName, locale: "es_ES", type: "website", images: [{ url: "/og-default.png", width: 1200, height: 630 }] },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh bg-paper text-ink">{children}</body>
    </html>
  );
}
