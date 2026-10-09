const nf = new Intl.NumberFormat("fa-IR");

export const formatNumber = (n: number) => nf.format(n);
export const formatSizeCm = (widthCm: number, lengthCm: number) =>
  `${nf.format(widthCm)} × ${nf.format(lengthCm)} سانتی‌متر`;
