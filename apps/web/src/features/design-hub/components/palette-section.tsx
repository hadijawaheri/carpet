import { contrastRatio } from "@/lib/contrast";
import { formatNumber } from "@/lib/format";

import { palette, swatches, textPairs } from "../data/palette";
import { HubSection } from "./hub-section";

const ratio = (n: number) => formatNumber(Math.round(n * 10) / 10);

export function PaletteSection() {
  return (
    <HubSection
      id="color"
      title="رنگ"
      lead="تالارهای فرش را معمولاً قرمز تیره رنگ می‌کنند تا رنگ‌های فرش روشن‌تر دیده شوند. اینجا هم دیوار روناس است و هر چیزی که باید خوانده شود روی مقوای کرم می‌نشیند."
    >
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {swatches.map((s) => (
          <li key={s.token} className="flex flex-col gap-3">
            <div
              className="flex aspect-[4/5] flex-col justify-end p-4 shadow-mount"
              style={{ backgroundColor: `var(--${s.token})`, color: `var(--${s.on})` }}
            >
              <span className="font-display text-2xl font-bold">{s.name}</span>
              <span className="text-label">{s.role}</span>
            </div>
            <p className="flex justify-between gap-2 font-mono text-accession text-on-wall-muted">
              <span dir="ltr">--{s.token}</span>
              <span dir="ltr">{palette[s.token]}</span>
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-12 bg-card p-6 text-card-foreground shadow-mount sm:p-8">
        <h3 className="mb-4 font-display text-heading font-bold">کنتراست متن</h3>
        <ul className="grid gap-x-10 sm:grid-cols-2">
          {textPairs.map(([text, surface]) => (
            <li
              key={`${text}-${surface}`}
              className="flex items-center justify-between gap-4 border-b border-border py-2"
            >
              <span className="flex items-center gap-3 text-spec">
                <span
                  aria-hidden
                  className="grid size-8 place-items-center font-display text-lg font-bold"
                  style={{ backgroundColor: `var(--${surface})`, color: `var(--${text})` }}
                >
                  ف
                </span>
                <span dir="ltr" className="font-mono text-accession">
                  {text} / {surface}
                </span>
              </span>
              <span className="tabular-nums">
                {ratio(contrastRatio(palette[text], palette[surface]))} به ۱
              </span>
            </li>
          ))}
        </ul>
      </div>
    </HubSection>
  );
}
