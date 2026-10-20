import { getSettings, validAdsenseClient } from "@/lib/settings";

export const revalidate = 300;

/** ads.txt generado a partir del ID de editor de AdSense del panel. */
export async function GET() {
  const s = await getSettings();
  const body = validAdsenseClient(s.adsenseClient)
    ? `google.com, ${s.adsenseClient.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`
    : "# ads.txt: indica el ID de editor de AdSense en el panel (Ajustes).\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
