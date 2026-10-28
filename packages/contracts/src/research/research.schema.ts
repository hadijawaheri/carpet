import { z } from "zod";

import { knotDensitySchema, pileMaterialSchema } from "../carpet/carpet.schema";

export const articleTopicSchema = z.enum(["density", "material", "price", "craft"]);
export type ArticleTopic = z.infer<typeof articleTopicSchema>;

export const articleSummarySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  topic: articleTopicSchema,
  readingMinutes: z.number().int().positive(),
  /** Drafts are outlines awaiting research; the UI labels them so no claim reads as final. */
  isDraft: z.boolean().default(true),
});
export type ArticleSummary = z.infer<typeof articleSummarySchema>;

/** A typical density range for one construction, used by the comparison table. */
export const materialSpecSchema = z.object({
  material: pileMaterialSchema,
  low: knotDensitySchema,
  high: knotDensitySchema,
  feel: z.string().min(1),
});
export type MaterialSpec = z.infer<typeof materialSpecSchema>;

export const articleSectionSchema = z.object({
  heading: z.string().min(1),
  paragraphs: z.array(z.string().min(1)).min(1),
});
export type ArticleSection = z.infer<typeof articleSectionSchema>;

/** A full encyclopedia article: the summary plus its body. */
export const articleSchema = articleSummarySchema.extend({
  sections: z.array(articleSectionSchema).min(1),
});
export type Article = z.infer<typeof articleSchema>;
