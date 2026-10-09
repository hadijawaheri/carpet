/** Display-only gallery numbers for the placeholder collection; not a real museum inventory. */
export const accessionNumber = (index: number) => `FR–${String(index + 1).padStart(2, "0")}`;
