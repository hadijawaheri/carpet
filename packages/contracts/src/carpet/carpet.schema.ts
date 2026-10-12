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

/** What the piece is for: a rug lies on the floor, a tableau (تابلو فرش) is woven to hang framed on a wall. */
export const carpetKindSchema = z.enum(["rug", "tableau"]);
export type CarpetKind = z.infer<typeof carpetKindSchema>;

export const carpetSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  kind: carpetKindSchema.default("rug"),
  name: z.string().min(1),
  material: pileMaterialSchema,
  widthCm: z.number().int().positive(),
  lengthCm: z.number().int().positive(),
  density: knotDensitySchema.optional(),
  /** Path under the web app's public folder, e.g. `/carpets/medallion-black.jpg`. */
  image: z.string().startsWith("/"),
  /** Pixel aspect of the cropped photo (width / height); the 3D mesh uses it. */
  imageAspect: z.number().positive(),
  /** True while the photo is a stand-in until the owner supplies the final one. */
  isPlaceholder: z.boolean().default(false),
});
export type Carpet = z.infer<typeof carpetSchema>;
