import { verifyOtpSchema } from "@farsh/contracts";

import { createZodDto } from "../../../common/zod/create-zod-dto.js";

export class VerifyOtpDto extends createZodDto(verifyOtpSchema) {}
