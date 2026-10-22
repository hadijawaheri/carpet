import { z } from "zod";

/**
 * An optional free-text field: blank or whitespace-only counts as "not given", so an emptied form
 * input and an omitted key mean the same thing on both sides.
 */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);
