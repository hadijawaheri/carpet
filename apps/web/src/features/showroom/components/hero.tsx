"use client";

import type { PileMaterial } from "@farsh/contracts";
import { Award, Feather, Hand } from "lucide-react";
import { type PointerEvent, useMemo, useRef, useState } from "react";

import { CarpetStage, materialLabels, PointerTilt } from "@/features/carpet-viewer";

import { MaterialPills } from "./material-pills";
import { useShowroom } from "./showroom-store";

const badges = [
  { icon: Award, label: "شناسنامه‌ی هر فرش" },
  { icon: Hand, label: "حس واقعی پرز" },
  { icon: Feather, label: "ابریشم و پشم" },
];

export function Hero() {
  const { carpets } = useShowroom();
  const carpet = carpets[0];
  const [material, setMaterial] = useState<PileMaterial | null>(null);
  const tilt = useMemo(() => new PointerTilt(), []);
  const sectionRef = useRef<HTMLElement>(null);

  // CSS variables move the glow and floor shadow without re-rendering on every pointer move.
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    tilt.track(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
    event.currentTarget.style.setProperty("--tx", String(tilt.x));
    event.currentTarget.style.setProperty("--ty", String(tilt.y));
  };
  const onPointerLeave = () => {
    tilt.reset();
    sectionRef.current?.style.setProperty("--tx", "0");
    sectionRef.current?.style.setProperty("--ty", "0");
  };

  return (
    <section
      id="top"
      ref={sectionRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative overflow-hidden pt-32 pb-20 [--tx:0] [--ty:0]"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
        <div className="animate-fade-up">
          <p className="eyebrow text-gold-text">فرش ایرانی · گره به گره</p>
          <h1 className="mt-6 text-5xl leading-[1.25] md:text-7xl md:leading-[1.2]">
            قرن‌ها میراث، <span className="text-madder">بافته در هنر</span>
          </h1>
          <p className="mt-6 max-w-lg leading-relaxed text-muted-foreground">
            فرش‌هایی که می‌شود گرفت و تکان داد. نقش، جنس و گره‌ی هر فرش را از نزدیک ببینید، در اتاق
            خودتان تصورش کنید و بعد درباره‌اش بپرسید.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#collection"
              className="bg-primary px-8 py-4 text-sm text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              دیدن مجموعه
            </a>
            <a
              href="#visualizer"
              className="border border-foreground px-8 py-4 text-sm transition hover:-translate-y-0.5 hover:bg-card"
            >
              پیش‌نمایش در اتاق
            </a>
          </div>
          <ul className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t pt-8 text-xs text-muted-foreground">
            {badges.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col gap-2">
                <Icon className="size-5 text-gold" strokeWidth={1.3} aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {carpet ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex h-[440px] w-full items-center justify-center sm:h-[560px]">
              <div
                aria-hidden
                className="absolute h-[70%] w-[70%] rounded-full bg-madder/10 blur-3xl"
                style={{ transform: "translate(calc(var(--tx) * -40px), calc(var(--ty) * -40px))" }}
              />
              <div
                aria-hidden
                className="absolute bottom-6 h-10 w-[55%] rounded-[50%] bg-foreground/25 blur-2xl transition-transform duration-300"
                style={{ transform: "translateX(calc(var(--tx) * 30px))" }}
              />
              <div className="relative size-full animate-float">
                <CarpetStage
                  carpet={carpet}
                  material={material ?? carpet.material}
                  tilt={tilt}
                  imageSizes="(min-width: 1024px) 40vw, 80vw"
                  className="size-full"
                />
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              گوشه‌ی فرش را بگیرید و تکانش دهید · {carpet.name}
            </p>
            <MaterialPills
              label="حس پرز"
              value={material ?? carpet.material}
              onChange={setMaterial}
              options={(["silk", "wool", "machine"] as const).map((m) => ({
                value: m,
                label: materialLabels[m],
              }))}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
