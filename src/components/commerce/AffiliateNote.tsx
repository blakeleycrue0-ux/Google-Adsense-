import Link from "next/link";
import { getSettings } from "@/lib/settings";

export async function AffiliateNote({ className = "" }: { className?: string }) {
  const s = await getSettings();
  return (
    <p className={`text-[12px] leading-relaxed text-muted ${className}`}>
      {s.affiliates.disclosure}{" "}
      <Link href="/legal/publicidad-y-afiliados" className="underline underline-offset-2 hover:text-ink">
        Cómo nos financiamos
      </Link>
      .
    </p>
  );
}
