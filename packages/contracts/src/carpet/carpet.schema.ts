import { z } from "zod";

export const pileMaterialSchema = z.enum(["silk", "wool", "machine"]);
export type PileMaterial = z.infer<typeof pileMaterialSchema>;

/**
 * Knot density is stored in the unit the trade uses for each construction:
 * raj (knots per 7 cm) for hand-knotted carpets, shaneh (knots per metre of width) for machine-made.
 */
export const knotDensitySchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal("raj"), value: z.number().int().positive() }),
  z.object({
    unit: z.literal("shaneh"),
    value: z.number().int().positive(),
    takham: z.number().int().positive().optional(),
  }),
]);
export type KnotDensity = z.infer<typeof knotDensitySchema>;

export const carpetSlugSchema = z
  .string()
  .regex(/^[a-z0-9-]+$/)
  .max(80);

/**
 * Where and by whom a carpet was woven, for its certificate. Every field is optional: an empty one is
 * shown as "not recorded", never guessed. The year is Persian (Solar Hijri), as the trade states it.
 */
export const provenanceSchema = z.object({
  origin: z.string().trim().min(1).max(80).optional(),
  workshop: z.string().trim().min(1).max(80).optional(),
  weaver: z.string().trim().min(1).max(80).optional(),
  wovenYear: z.number().int().min(1200).max(1500).optional(),
});
export type Provenance = z.infer<typeof provenanceSchema>;

export const carpetSchema = z.object({
  slug: carpetSlugSchema,
  name: z.string().min(1),
  material: pileMaterialSchema,
  widthCm: z.number().int().positive(),
  lengthCm: z.number().int().positive(),
  density: knotDensitySchema.optional(),
  /** Path under the web app's public folder, e.g. `/carpets/medallion-black.jpg`. */
  image: z.string().startsWith("/"),
  /** Pixel aspect of the cropped photo (width / height); the 3D mesh uses it. */
  imageAspect: z.number().positive(),
  /** Integer rials, never a float; absent means "price on request". */
  priceRial: z.number().int().positive().optional(),
  provenance: provenanceSchema.optional(),
  /** True while the photo is a stand-in until the owner supplies the final one. */
  isPlaceholder: z.boolean().default(false),
});
export type Carpet = z.infer<typeof carpetSchema>;
