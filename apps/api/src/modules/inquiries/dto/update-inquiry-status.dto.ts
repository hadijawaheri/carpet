import { updateInquiryStatusSchema } from "@farsh/contracts";

import { createZodDto } from "../../../common/zod/create-zod-dto.js";

export class UpdateInquiryStatusDto extends createZodDto(updateInquiryStatusSchema) {}
