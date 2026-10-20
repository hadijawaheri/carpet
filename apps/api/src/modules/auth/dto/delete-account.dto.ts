import { deleteAccountSchema } from "@farsh/contracts";

import { createZodDto } from "../../../common/zod/create-zod-dto.js";

export class DeleteAccountDto extends createZodDto(deleteAccountSchema) {}
