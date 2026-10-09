import { HubSection } from "./hub-section";

const steps = [1, 2, 3, 4, 6, 8, 12, 16, 24];
const radii = [
  { token: "sm", label: "۱ پیکسل" },
  { token: "md", label: "۲ پیکسل" },
  { token: "lg", label: "۴ پیکسل" },
  { token: "xl", label: "۸ پیکسل" },
] as const;

const radiusClass: Record<(typeof radii)[number]["token"], string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
};

export function SpaceSection() {
  return (
    <HubSection
      id="space"
      title="فاصله و لبه"
      lead="فاصله‌ها مضرب چهار پیکسل‌اند، مثل شبکه‌ی نقشه‌ی فرش. گوشه‌ها تقریباً تیزند، چون لبه‌ی فرش و مقوای برچسب تیز است."
    >
      <div className="grid gap-12 lg:grid-cols-2">
        <ul className="flex flex-col gap-3">
          {steps.map((n) => (
            <li key={n} className="grid grid-cols-[4rem_1fr] items-center gap-4">
              <span className="font-mono text-xs text-on-wall-muted" dir="ltr">
                {n * 4}px
              </span>
              <span className="h-3 bg-saffron" style={{ width: `calc(var(--spacing) * ${n})` }} />
            </li>
          ))}
        </ul>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {radii.map((r) => (
            <li key={r.token} className="flex flex-col gap-2">
              <span
                className={`${radiusClass[r.token]} aspect-square border-2 border-saffron bg-card`}
              />
              <span className="font-mono text-xs" dir="ltr">
                rounded-{r.token}
              </span>
              <span className="text-label text-on-wall-muted">{r.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </HubSection>
  );
}
