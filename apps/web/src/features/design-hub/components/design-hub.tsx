import { SiteHeader } from "@/components/layout/site-header";

import { ComponentsSection } from "./components-section";
import { MotionSection } from "./motion-section";
import { PaletteSection } from "./palette-section";
import { SpaceSection } from "./space-section";
import { TypeSection } from "./type-section";

const toc = [
  { id: "color", label: "رنگ" },
  { id: "type", label: "حروف" },
  { id: "space", label: "فاصله و لبه" },
  { id: "components", label: "اجزا" },
  { id: "motion", label: "حرکت و جنس" },
];

export function DesignHub() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-10">
        <div className="flex flex-col gap-8 pt-10 pb-16 sm:pt-16 sm:pb-24">
          <p className="font-mono text-xs tracking-widest text-muted-foreground">
            <span dir="ltr">FARSH · DESIGN HUB · v0.2</span>
          </p>
          <h1 className="font-display text-display-l font-bold sm:text-display-xl">
            دیزاین <span className="text-brand-text">هاب</span>
          </h1>
          <p className="max-w-2xl text-lead text-muted-foreground">
            زبان بصری سایت فرش در یک صفحه: رنگ‌هایی که از رنگرزی سنتی آمده‌اند، حروفی که با کتیبه‌ی
            حاشیه هم‌خانواده‌اند، و فرشی که می‌شود گرفت و تکانش داد.
          </p>
          <nav aria-label="بخش‌ها" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
            {toc.map((t, i) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className="flex items-baseline gap-2 rounded-sm underline-offset-8 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="font-latin text-brand-text italic" dir="ltr">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {t.label}
              </a>
            ))}
          </nav>
        </div>
        <PaletteSection />
        <TypeSection />
        <SpaceSection />
        <ComponentsSection />
        <MotionSection />
      </main>
    </>
  );
}
