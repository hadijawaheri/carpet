import type { ApiResponse, CreateInquiryInput, InquiryDto } from "@farsh/contracts";

import { api } from "@/lib/api/client";

export const createInquiry = (input: CreateInquiryInput) =>
  api<ApiResponse<InquiryDto>>("/inquiries", { method: "POST", json: input });
