"use client";

import { useState } from "react";
import { FacebookLogo, LinkIcon, LinkedInLogo, ShareIcon, TelegramLogo, WhatsAppLogo, XLogo } from "@/components/ui/Icons";

export function ShareButtons({ url, title, layout = "row" }: { url: string; title: string; layout?: "row" | "column" }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const targets = [
    { label: "Compartir en X", href: `https://x.com/intent/post?url=${u}&text=${t}`, Icon: XLogo },
    { label: "Compartir en WhatsApp", href: `https://wa.me/?text=${t}%20${u}`, Icon: WhatsAppLogo },
    { label: "Compartir en Telegram", href: `https://t.me/share/url?url=${u}&text=${t}`, Icon: TelegramLogo },
    { label: "Compartir en LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, Icon: LinkedInLogo },
    { label: "Compartir en Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, Icon: FacebookLogo },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const native = async () => {
    try {
      await navigator.share({ title, url });
    } catch {}
  };

  const btn =
    "relative flex size-9 items-center justify-center rounded-full border border-line text-ink-2 transition-[color,border-color,transform] duration-200 hover:-translate-y-px hover:border-ink hover:text-ink";

  return (
    <div className={`flex ${layout === "column" ? "flex-col items-start" : "flex-row flex-wrap items-center"} gap-2`}>
      <button type="button" onClick={native} className={`${btn} sm:hidden`} aria-label="Compartir">
        <ShareIcon width={16} height={16} />
      </button>
      {targets.map(({ label, href, Icon }) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={btn}>
          <Icon />
        </a>
      ))}
      <button type="button" onClick={copy} className={btn} aria-label="Copiar enlace" title="Copiar enlace">
        <LinkIcon width={16} height={16} />
        <span
          role="status"
          className={`pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-xs bg-ink px-2 py-1 text-[11px] text-paper transition-opacity ${
            copied ? "opacity-100" : "opacity-0"
          }`}
        >
          {copied ? "Enlace copiado" : ""}
        </span>
      </button>
    </div>
  );
}
