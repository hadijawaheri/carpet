import type { Carpet } from "@farsh/contracts";

import { materialLabels } from "@/features/carpet-viewer";
import { formatDensity, knotsPerSquareMetre } from "@/lib/density";
import { formatNumber, formatSizeCm } from "@/lib/format";
import { cn } from "@/lib/utils";

/** The carpet's measured facts; anything not recorded says so instead of guessing. */
export function CarpetFacts({ carpet, className }: { carpet: Carpet; className?: string }) {
  const knots = carpet.density ? knotsPerSquareMetre(carpet.density) : null;
  const facts = [
    ["تراکم", carpet.density ? formatDensity(carpet.density) : "ثبت نشده"],
    ["ابعاد", formatSizeCm(carpet.widthCm, carpet.lengthCm)],
    ["جنس", materialLabels[carpet.material]],
    [
      "گره در متر مربع",
      knots === null
        ? "ثبت نشده"
        : `${carpet.density?.unit === "raj" ? "حدود " : ""}${formatNumber(knots)}`,
    ],
  ] as const;

  return (
    <dl className={cn("grid grid-cols-2 gap-y-4 border-y py-6 text-sm", className)}>
      {facts.map(([term, value]) => (
        <div key={term}>
          <dt className="eyebrow text-muted-foreground">{term}</dt>
          <dd className="mt-1">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
