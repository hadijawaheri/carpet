import type { z } from "zod";

import { paginationQuerySchema } from "../common/pagination";
import { inquiryStatusSchema } from "./inquiry.schema";

export const listInquiriesQuerySchema = paginationQuerySchema.extend({
  status: inquiryStatusSchema.optional(),
});
export type ListInquiriesQuery = z.infer<typeof listInquiriesQuerySchema>;
