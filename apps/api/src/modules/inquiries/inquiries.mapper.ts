import type { InquiryDto } from "@farsh/contracts";
import { maskMobile } from "@farsh/contracts";

import type { Inquiry } from "./schemas/inquiry.schema.js";

/** Lists show a masked mobile; only the single-inquiry view carries the full number. */
export function toInquiryDto(
  inquiry: Inquiry,
  { fullMobile }: { fullMobile: boolean },
): InquiryDto {
  return {
    id: inquiry._id.toString(),
    name: inquiry.name,
    mobile: fullMobile ? inquiry.mobile : maskMobile(inquiry.mobile),
    carpetSlugs: [...inquiry.carpetSlugs],
    message: inquiry.message ?? null,
    status: inquiry.status,
    createdAt: inquiry.createdAt.toISOString(),
  };
}
