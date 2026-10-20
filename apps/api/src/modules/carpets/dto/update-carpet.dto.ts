import { updateCarpetSchema } from "@farsh/contracts";

import { createZodDto } from "../../../common/zod/create-zod-dto.js";

export class UpdateCarpetDto extends createZodDto(updateCarpetSchema) {}
