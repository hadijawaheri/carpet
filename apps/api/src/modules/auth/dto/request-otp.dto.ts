import { requestOtpSchema } from "@farsh/contracts";

import { createZodDto } from "../../../common/zod/create-zod-dto.js";

export class RequestOtpDto extends createZodDto(requestOtpSchema) {}
