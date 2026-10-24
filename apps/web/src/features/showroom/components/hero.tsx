"use client";

import type { PileMaterial } from "@farsh/contracts";
import { Award, ChevronLeft, ChevronRight, Feather, Hand } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CarpetRackStage, materialLabels } from "@/features/carpet-viewer";

import { MaterialPills } from "./material-pills";
import { useShowroom } from "./showroom-store";

const badges = [
  { icon: Award, label: "شناسنامه‌ی هر فرش" },
  { icon: Hand, label: "حس واقعی پرز" },
  { icon: Feather, label: "ابریشم و پشم" },
];

export function Hero() {
  const { carpets } = useShowroom();
  const [current, setCurrent] = useState(0);
  const [material, setMaterial] = useState<PileMaterial | null>(null);
  const carpet = carpets[current];

  // Turning to another carpet drops the pile override: each carpet first shows its own feel.
  const turnTo = (index: number) => {
    setCurrent((index + carpets.length) % carpets.length);
    setMaterial(null);
  };

  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1fr_1.2fr]">
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
            <div className="relative flex h-[520px] w-full items-center justify-center sm:h-[660px]">
              <div
                aria-hidden
                className="absolute h-[70%] w-[70%] rounded-full bg-madder/10 blur-3xl"
              />
              <CarpetRackStage
                carpets={carpets}
                current={current}
                frontMaterial={material ?? carpet.material}
                onSelect={turnTo}
                imageSizes="(min-width: 1024px) 40vw, 80vw"
                className="relative size-full"
              />
            </div>
            <div className="flex w-full max-w-md items-center justify-between gap-4">
              <Button
                variant="secondary"
                size="icon"
                aria-label="فرش قبلی"
                onClick={() => turnTo(current - 1)}
              >
                <ChevronRight className="rtl:rotate-180" aria-hidden />
              </Button>
              <p aria-live="polite" className="text-center text-sm">
                {carpet.name}
                <span className="text-muted-foreground">
                  {" "}
                  · {materialLabels[carpet.material]} · {(current + 1).toLocaleString("fa-IR")} از{" "}
                  {carpets.length.toLocaleString("fa-IR")}
                </span>
              </p>
              <Button
                variant="secondary"
                size="icon"
                aria-label="فرش بعدی"
                onClick={() => turnTo(current + 1)}
              >
                <ChevronLeft className="rtl:rotate-180" aria-hidden />
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              فرش‌ها را مثل رگال ورق بزنید · گوشه‌ی پایین فرش جلویی را بگیرید و تکانش دهید
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
