import { listCarpetsQuerySchema } from "@farsh/contracts";

import { createZodDto } from "../../../common/zod/create-zod-dto.js";

export class ListCarpetsQueryDto extends createZodDto(listCarpetsQuerySchema) {}
