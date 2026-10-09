const nf = new Intl.NumberFormat("fa-IR");
const compact = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 });

export const formatNumber = (n: number) => nf.format(n);
export const formatCompact = (n: number) => compact.format(n);
export const formatSizeCm = (widthCm: number, lengthCm: number) =>
  `${nf.format(widthCm)} × ${nf.format(lengthCm)} سانتی‌متر`;
