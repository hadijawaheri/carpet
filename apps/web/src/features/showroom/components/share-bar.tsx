"use client";

import { Link2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

import { shareLinks } from "@/lib/share";

const linkClass =
  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition hover:border-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

/** WhatsApp, Telegram and a plain copy, for the carpet's permanent address. */
export function ShareBar({ url, text }: { url: string; text: string }) {
  const links = shareLinks(url, text);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("پیوند این فرش کپی شد");
    } catch (e: unknown) {
      // Clipboard access is refused on insecure origins and in some in-app browsers
      console.warn("Clipboard write failed", e);
      toast.error("کپی نشد؛ نشانی را از نوار مرورگر بردارید");
    }
  };

  return (
    <div role="group" aria-label="اشتراک‌گذاری این فرش" className="flex flex-wrap gap-2">
      <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className={linkClass}>
        <MessageCircle className="size-4" aria-hidden />
        واتساپ
      </a>
      <a href={links.telegram} target="_blank" rel="noopener noreferrer" className={linkClass}>
        <Send className="size-4" aria-hidden />
        تلگرام
      </a>
      <button type="button" onClick={copy} className={linkClass}>
        <Link2 className="size-4" aria-hidden />
        کپی پیوند
      </button>
    </div>
  );
}
