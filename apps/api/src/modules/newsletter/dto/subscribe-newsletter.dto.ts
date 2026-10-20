import { subscribeNewsletterSchema } from "@farsh/contracts";

import { createZodDto } from "../../../common/zod/create-zod-dto.js";

export class SubscribeNewsletterDto extends createZodDto(subscribeNewsletterSchema) {}
