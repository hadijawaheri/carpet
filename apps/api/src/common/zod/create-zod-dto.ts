import type { z, ZodType } from "zod";

export interface ZodDtoStatic<S extends ZodType> {
  new (): z.infer<S>;
  readonly schema: S;
}

/** Turns a contracts schema into a class, so Nest's param metadata can carry the schema to the pipe. */
export function createZodDto<S extends ZodType>(schema: S): ZodDtoStatic<S> {
  class ZodDto {
    static readonly schema = schema;
  }
  return ZodDto as unknown as ZodDtoStatic<S>;
}
