import { z } from "zod";

import { paginationQuerySchema } from "../common/pagination";
import {
  carpetSchema,
  knotDensitySchema,
  pileMaterialSchema,
  provenanceSchema,
} from "./carpet.schema";

export const listCarpetsQuerySchema = paginationQuerySchema.extend({
  material: pileMaterialSchema.optional(),
});
export type ListCarpetsQuery = z.infer<typeof listCarpetsQuerySchema>;

export const createCarpetSchema = carpetSchema;
export type CreateCarpetInput = z.infer<typeof createCarpetSchema>;

// Built field by field: `.partial()` would keep isPlaceholder's default and reset it on every update.
// null clears an optional field (a price taken off, a density no longer known); absent leaves it.
export const updateCarpetSchema = carpetSchema
  .omit({ slug: true, isPlaceholder: true, density: true, priceRial: true, provenance: true })
  .partial()
  .extend({
    isPlaceholder: z.boolean().optional(),
    density: knotDensitySchema.nullable().optional(),
    priceRial: z.number().int().positive().nullable().optional(),
    provenance: provenanceSchema.nullable().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, "دست‌کم یک فیلد را تغییر دهید");
export type UpdateCarpetInput = z.infer<typeof updateCarpetSchema>;

/** What `POST /v1/media/carpets` returns: ready to put on a carpet with create or update. */
export const uploadedImageSchema = carpetSchema.pick({ image: true, imageAspect: true });
export type UploadedImage = z.infer<typeof uploadedImageSchema>;
