import { z } from "zod";

import { carpetSlugSchema } from "../carpet/carpet.schema";
import { mobileSchema } from "../common/iran";

export const INQUIRY_STATUSES = ["new", "contacted", "closed"] as const;
export const inquiryStatusSchema = z.enum(INQUIRY_STATUSES);
export type InquiryStatus = z.infer<typeof inquiryStatusSchema>;

/** A visitor asks about one or more carpets from the selection drawer; there is no online payment. */
export const createInquirySchema = z.object({
  name: z.string().trim().min(2, "نام را کامل بنویسید").max(80),
  mobile: mobileSchema,
  carpetSlugs: z
    .array(carpetSlugSchema)
    .min(1, "دست‌کم یک فرش انتخاب کنید")
    .max(10)
    .refine((slugs) => new Set(slugs).size === slugs.length, "فرش تکراری انتخاب شده است"),
  message: z.string().trim().max(1000).optional(),
});
export type CreateInquiryInput = z.infer<typeof createInquirySchema>;

export const inquiryDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  mobile: z.string(),
  carpetSlugs: z.array(z.string()),
  message: z.string().nullable(),
  status: inquiryStatusSchema,
  createdAt: z.string(),
});
export type InquiryDto = z.infer<typeof inquiryDtoSchema>;

export const updateInquiryStatusSchema = z.object({ status: inquiryStatusSchema });
export type UpdateInquiryStatusInput = z.infer<typeof updateInquiryStatusSchema>;
