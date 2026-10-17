import type { PageMeta } from "@farsh/contracts";

export function toPageMeta(page: number, limit: number, totalItems: number): PageMeta {
  return { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) };
}

/** Escapes user text before it goes into a $regex, so it matches literally. */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
