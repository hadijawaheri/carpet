import { createCarpetSchema } from "@farsh/contracts";

import { createZodDto } from "../../../common/zod/create-zod-dto.js";

export class CreateCarpetDto extends createZodDto(createCarpetSchema) {}
