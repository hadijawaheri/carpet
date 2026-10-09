import { carpets } from "@/features/catalog";

import { HubSection } from "./hub-section";
import { MaterialLab } from "./material-lab";

const easings = [
  { token: "ease-settle", value: "cubic-bezier(0.22, 1, 0.36, 1)", use: "ورود کارت، بزرگ‌شدن عکس" },
  { token: "duration-300", value: "300ms", use: "لینک و فلش" },
  { token: "duration-700", value: "700ms", use: "زوم آرام عکس فرش" },
];

export function MotionSection() {
  const carpet = carpets[0];
  return (
    <HubSection
      id="motion"
      index="05"
      latin="Motion & material"
      title="حرکت و جنس"
      lead="حرکت در این سایت از خود فرش می‌آید. گوشه‌ی فرش را بگیرید و تکان دهید، بعد جنس را عوض کنید: ابریشم دیرتر آرام می‌گیرد و برق جهت‌دار دارد، ماشینی سفت و یکدست است."
    >
      {carpet ? <MaterialLab carpet={carpet} /> : null}
      <ul className="mt-12 grid gap-4 sm:grid-cols-3">
        {easings.map((e) => (
          <li key={e.token} className="flex flex-col gap-1 border-t-2 border-foreground pt-3">
            <span className="font-mono text-xs">
              <span dir="ltr">{e.token}</span>
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              <span dir="ltr">{e.value}</span>
            </span>
            <span className="text-label">{e.use}</span>
          </li>
        ))}
      </ul>
    </HubSection>
  );
}
