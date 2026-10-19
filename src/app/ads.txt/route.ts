import { getSettings } from "@/lib/settings";

export const revalidate = 300;

/** ads.txt generado a partir del ID de editor de AdSense configurado. */
export async function GET() {
  const s = await getSettings();
  const pub = s.ads.client.replace(/^ca-/, "");
  const body = /^pub-\d{10,20}$/.test(pub)
    ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
    : "# ads.txt: configura el ID de editor de AdSense en el panel (Ajustes → Publicidad).\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
