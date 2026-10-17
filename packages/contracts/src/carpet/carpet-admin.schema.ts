import { z } from "zod";

import { paginationQuerySchema } from "../common/pagination";
import { carpetSchema, pileMaterialSchema } from "./carpet.schema";

export const listCarpetsQuerySchema = paginationQuerySchema.extend({
  material: pileMaterialSchema.optional(),
});
export type ListCarpetsQuery = z.infer<typeof listCarpetsQuerySchema>;

export const createCarpetSchema = carpetSchema;
export type CreateCarpetInput = z.infer<typeof createCarpetSchema>;

// Built field by field: `.partial()` would keep isPlaceholder's default and reset it on every update
export const updateCarpetSchema = carpetSchema
  .omit({ slug: true, isPlaceholder: true })
  .partial()
  .extend({ isPlaceholder: z.boolean().optional() })
  .refine((input) => Object.keys(input).length > 0, "دست‌کم یک فیلد را تغییر دهید");
export type UpdateCarpetInput = z.infer<typeof updateCarpetSchema>;
