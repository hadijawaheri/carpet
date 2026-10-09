import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { contrastRatio } from "@/lib/contrast";
import { cn } from "@/lib/utils";

import { palette, swatches, textPairs } from "../data/palette";
import { HubSection } from "./hub-section";

function ThemePanel({ theme }: { theme: "light" | "dark" }) {
  return (
    <div
      className={cn(
        theme,
        "flex flex-col gap-5 rounded-lg border border-border bg-background p-6 text-foreground sm:p-8",
      )}
    >
      <p className="font-mono text-xs tracking-widest text-muted-foreground">
        <span dir="ltr">{theme.toUpperCase()}</span>
      </p>
      <p className="font-display text-heading font-semibold">
        نقش <span className="text-brand-text">ترنج</span> روی زمینه‌ی{" "}
        <span className="text-gold-text">کرم</span>
      </p>
      <p className="text-body text-muted-foreground">
        قرمز روناس، لاجورد و زعفرانی همان سه رنگی‌اند که بیشترِ فرش‌های کلاسیک ایرانی با آن‌ها رنگ
        شده‌اند.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button size="sm">مشاهده‌ی فرش</Button>
        <Button size="sm" variant="secondary">
          مقایسه‌ی جنس
        </Button>
        <Badge variant="muted" className="self-center">
          ابریشم
        </Badge>
      </div>
    </div>
  );
}

export function PaletteSection() {
  return (
    <HubSection
      id="color"
      index="01"
      latin="Colour"
      title="رنگ"
      lead="روناس روی کرمِ پشمِ رنگ‌نشده، با لاجورد و زعفرانی به‌عنوان چاشنی. هر جفت متن و زمینه در هر دو حالت دست‌کم ۴٫۵ به ۱ کنتراست دارد."
    >
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {swatches.map((s) => (
          <li key={s.token} className="flex flex-col gap-3">
            <div
              className="flex aspect-[4/5] flex-col justify-end rounded-lg border border-border p-4"
              style={{ backgroundColor: `var(--${s.token})`, color: `var(--${s.on})` }}
            >
              <span className="font-display text-2xl font-semibold">{s.name}</span>
              <span className="text-label opacity-80">{s.role}</span>
            </div>
            <dl
              className="grid grid-cols-[auto_1fr] gap-x-3 font-mono text-xs text-muted-foreground"
              dir="ltr"
            >
              <dt className="text-foreground">--{s.token}</dt>
              <dd />
              <dt>light</dt>
              <dd>{palette[s.token].light}</dd>
              <dt>dark</dt>
              <dd>{palette[s.token].dark}</dd>
            </dl>
          </li>
        ))}
      </ul>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <ThemePanel theme="light" />
        <ThemePanel theme="dark" />
      </div>

      <details className="group mt-10">
        <summary className="cursor-pointer text-sm font-semibold text-brand-text">
          جدول کنتراست همه‌ی جفت‌های متن
        </summary>
        <ul className="mt-4 grid gap-x-8 gap-y-2 font-mono text-xs sm:grid-cols-2" dir="ltr">
          {textPairs.map(([text, surface]) => (
            <li
              key={`${text}-${surface}`}
              className="flex justify-between gap-4 border-b border-border py-1.5"
            >
              <span>
                {text} / {surface}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {contrastRatio(palette[text].light, palette[surface].light).toFixed(1)} ·{" "}
                {contrastRatio(palette[text].dark, palette[surface].dark).toFixed(1)}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </HubSection>
  );
}
