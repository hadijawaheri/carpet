import { createInquirySchema } from "@farsh/contracts";

import { createZodDto } from "../../../common/zod/create-zod-dto.js";

export class CreateInquiryDto extends createZodDto(createInquirySchema) {}
