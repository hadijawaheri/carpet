"use client";

import { Box } from "lucide-react";
import Image from "next/image";
import { useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

type Platform = "quick-look" | "scene-viewer" | "other";

interface ViewInRoomProps {
  name: string;
  image: string;
  glbPath: string;
  usdzPath: string;
  pagePath: string;
  /** The page's address as a QR code, for opening it on a phone from a desktop. */
  qr: string;
}

let detected: Platform | undefined;

function detectPlatform(): Platform {
  if (detected) return detected;
  // Safari on iPhone and iPad advertises Quick Look through rel="ar" support
  if (document.createElement("a").relList.supports("ar")) detected = "quick-look";
  else if (/android/i.test(navigator.userAgent)) detected = "scene-viewer";
  else detected = "other";
  return detected;
}

/**
 * Hands the carpet to the phone's own AR viewer at its real size. Both viewers run outside the page,
 * so no camera permission or AR library reaches the site; a desktop gets a QR code to the phone.
 */
export function ViewInRoom({ name, image, glbPath, usdzPath, pagePath, qr }: ViewInRoomProps) {
  const platform = useSyncExternalStore(
    () => () => {},
    detectPlatform,
    (): Platform => "other",
  );
  const [showQr, setShowQr] = useState(false);

  if (platform === "quick-look") {
    return (
      // Quick Look only opens a rel="ar" link whose first child is an image
      <a
        rel="ar"
        href={`${usdzPath}#allowsContentScaling=0`}
        className="group inline-flex items-center gap-3"
      >
        <Image src={image} alt="" width={40} height={53} className="h-12 w-auto object-contain" />
        <span className="text-sm text-madder underline-offset-6 group-hover:underline">
          در اتاق خودم ببینم
        </span>
      </a>
    );
  }

  if (platform === "scene-viewer") {
    const origin = window.location.origin;
    const params = new URLSearchParams({
      file: new URL(glbPath, origin).href,
      mode: "ar_only",
      // Fixed scale: a 2 × 3 m carpet must look 2 × 3 m on the floor
      resizable: "false",
      title: name,
    });
    const fallback = encodeURIComponent(new URL(pagePath, origin).href);
    const intent = `intent://arvr.google.com/scene-viewer/1.2?${params.toString()}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${fallback};end;`;
    return (
      <Button asChild variant="secondary">
        <a href={intent}>
          <Box aria-hidden />
          در اتاق خودم ببینم
        </a>
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <Button
        type="button"
        variant="secondary"
        aria-expanded={showQr}
        aria-controls="view-in-room-qr"
        onClick={() => setShowQr((open) => !open)}
      >
        <Box aria-hidden />
        در اتاق خودم ببینم
      </Button>
      {showQr ? (
        <div id="view-in-room-qr" className="flex items-center gap-4 bg-alabaster p-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- a data: URI, nothing to optimize */}
          <img src={qr} alt="کد QR این صفحه" width={112} height={112} className="size-28" />
          <p className="max-w-56 text-sm text-muted-foreground">
            این کد را با دوربین گوشی بخوانید تا فرش را با اندازه‌ی واقعی‌اش روی کف اتاق ببینید.
          </p>
        </div>
      ) : null}
    </div>
  );
}
