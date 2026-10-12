"use client";

import type { Carpet } from "@farsh/contracts";
import { createDefaultRoomLayout } from "@farsh/contracts";
import { useSyncExternalStore } from "react";

import { decodeLayout } from "@/lib/room-codec";

import { HASH_PREFIX, RoomStudio } from "./room-studio";

const subscribeHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};

interface RoomDesignerProps {
  carpets: Carpet[];
}

/** Reads the room from the address once the page is in the browser; the server has no hash to read. */
export function RoomDesigner({ carpets }: RoomDesignerProps) {
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => null,
  );

  // "?carpet=slug" comes from the collection's "put it in a room" links.
  const search = useSyncExternalStore(
    subscribeHash,
    () => window.location.search,
    () => "",
  );

  if (hash === null) {
    return (
      <p role="status" className="grid min-h-[60dvh] place-items-center text-on-wall-muted">
        در حال آماده‌کردن اتاق…
      </p>
    );
  }

  const encoded = hash.startsWith(HASH_PREFIX) ? hash.slice(HASH_PREFIX.length) : "";
  const shared = encoded ? decodeLayout(encoded) : null;
  const wanted = new URLSearchParams(search).get("carpet");
  const first = carpets.find((c) => c.slug === wanted) ?? carpets[0];
  const initial = shared ?? (first ? createDefaultRoomLayout(first.slug) : null);
  if (!initial) return null;

  return (
    <RoomStudio
      carpets={carpets}
      initial={initial}
      notice={encoded && !shared ? "پیوند اتاق خراب بود؛ اتاق پیش‌فرض را می‌بینید." : undefined}
    />
  );
}
