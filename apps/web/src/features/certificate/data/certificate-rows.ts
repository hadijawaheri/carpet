import type { Carpet } from "@farsh/contracts";

import { materialLabels } from "@/features/carpet-viewer";
import { formatDensity, knotsPerSquareMetre } from "@/lib/density";
import { formatNumber, formatSizeCm } from "@/lib/format";

const NOT_RECORDED = "ثبت نشده";

// Persian years are written without grouping (۱۳۹۸, not ۱٬۳۹۸)
const year = new Intl.NumberFormat("fa-IR", { useGrouping: false });

/** Every line of the certificate; a missing fact reads "not recorded", never a guess. */
export function certificateRows(carpet: Carpet): [string, string][] {
  const knots = carpet.density ? knotsPerSquareMetre(carpet.density) : null;
  const p = carpet.provenance;
  return [
    ["نام", carpet.name],
    ["جنس پرز", materialLabels[carpet.material]],
    ["ابعاد", formatSizeCm(carpet.widthCm, carpet.lengthCm)],
    ["تراکم", carpet.density ? formatDensity(carpet.density) : NOT_RECORDED],
    [
      "گره در متر مربع",
      knots === null
        ? NOT_RECORDED
        : `${carpet.density?.unit === "raj" ? "حدود " : ""}${formatNumber(knots)}`,
    ],
    ["محل بافت", p?.origin ?? NOT_RECORDED],
    ["کارگاه", p?.workshop ?? NOT_RECORDED],
    ["بافنده", p?.weaver ?? NOT_RECORDED],
    ["سال بافت", p?.wovenYear ? year.format(p.wovenYear) : NOT_RECORDED],
  ];
}

/** A certificate vouches for a carpet only once its photo and facts are final and its origin known. */
export const isCertified = (carpet: Carpet) =>
  !carpet.isPlaceholder && Boolean(carpet.provenance?.origin);
