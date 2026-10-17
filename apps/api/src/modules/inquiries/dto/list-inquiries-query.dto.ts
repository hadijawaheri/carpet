import { listInquiriesQuerySchema } from "@farsh/contracts";

import { createZodDto } from "../../../common/zod/create-zod-dto.js";

export class ListInquiriesQueryDto extends createZodDto(listInquiriesQuerySchema) {}
