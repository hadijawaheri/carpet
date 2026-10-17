const nf = new Intl.NumberFormat("fa-IR");
const persianYear = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric" });

export const formatNumber = (n: number) => nf.format(n);
export const formatSizeCm = (widthCm: number, lengthCm: number) =>
  `${nf.format(widthCm)} × ${nf.format(lengthCm)} سانتی‌متر`;

/** Prices are stored in rials; the site shows tomans, as Iranian shops do. */
export const formatPriceRial = (rial: number | undefined) =>
  rial === undefined ? "استعلام قیمت" : `${nf.format(Math.round(rial / 10))} تومان`;

export const formatPersianYear = (date: Date) => persianYear.format(date);
