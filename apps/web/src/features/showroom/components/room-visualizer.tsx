"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { rooms } from "../data/rooms";
import { useShowroom } from "./showroom-store";

export function RoomVisualizer() {
  const { carpets } = useShowroom();
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [slug, setSlug] = useState(carpets[0]?.slug ?? "");
  const room = rooms.find((r) => r.id === roomId) ?? rooms[0];
  const carpet = carpets.find((c) => c.slug === slug) ?? carpets[0];
  if (!room || !carpet) return null;

  return (
    <section id="visualizer" className="scroll-mt-24 bg-alabaster linen py-24">
      <div className="mx-auto max-w-7xl px-6">
        <p className="eyebrow text-gold-text">پیش‌نمایش اتاق</p>
        <h2 className="mt-3 text-4xl md:text-5xl">زیر پای خودتان ببینید</h2>
        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_280px]">
          <div className="relative aspect-[16/10] overflow-hidden shadow-lift [perspective:900px]">
            <Image
              key={room.id}
              src={room.image}
              alt={`فضای ${room.label}`}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="animate-fade-up object-cover"
            />
            <div className="absolute inset-x-0 top-[72%] flex justify-center">
              <div
                className="w-[30%]"
                style={{ transform: "translateY(-50%) rotateX(66deg) rotateZ(90deg)" }}
              >
                <Image
                  key={`${carpet.slug}-${room.id}`}
                  src={carpet.image}
                  alt={`فرش ${carpet.name} روی کف ${room.label}`}
                  width={Math.round(900 * carpet.imageAspect)}
                  height={900}
                  sizes="30vw"
                  className="w-full animate-fade-up shadow-float"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-8">
            <fieldset>
              <legend className="eyebrow text-muted-foreground">فضا</legend>
              <div className="mt-3 flex flex-col gap-2">
                {rooms.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={room.id === r.id}
                    onClick={() => setRoomId(r.id)}
                    className={cn(
                      "border px-4 py-3 text-start text-sm transition",
                      room.id === r.id ? "border-foreground bg-card" : "hover:bg-card/60",
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="eyebrow text-muted-foreground">فرش</legend>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {carpets.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    aria-label={c.name}
                    aria-pressed={carpet.slug === c.slug}
                    onClick={() => setSlug(c.slug)}
                    className={cn(
                      "relative aspect-[3/4] overflow-hidden border-2 transition",
                      carpet.slug === c.slug
                        ? "border-gold"
                        : "border-transparent opacity-70 hover:opacity-100",
                    )}
                  >
                    <Image src={c.image} alt="" fill sizes="70px" className="object-cover" />
                  </button>
                ))}
              </div>
              <p className="mt-3 font-display text-xl">{carpet.name}</p>
            </fieldset>
          </div>
        </div>
      </div>
    </section>
  );
}
