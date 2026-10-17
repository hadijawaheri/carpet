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
        <div className="flex flex-col gap-8 pt-14 pb-16 sm:pt-20 sm:pb-24">
          <h1 className="font-display text-inscription font-bold">
            راهنمای <span className="text-saffron">طراحی</span>
          </h1>
          <p className="max-w-[52ch] text-lead text-on-wall-muted">
            قاعده‌های تالار در یک صفحه: دیوار روناس، مقوای کرم برای هر برچسب، حروف نسخ ایرانی برای
            کتیبه‌ها، و فرشی که با جنسش حرکت می‌کند.
          </p>
          <nav aria-label="بخش‌ها">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
              {toc.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className="inline-block rounded-sm py-1 decoration-saffron underline-offset-8 hover:underline focus-visible:ring-2 focus-visible:ring-saffron focus-visible:outline-none"
                  >
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
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
