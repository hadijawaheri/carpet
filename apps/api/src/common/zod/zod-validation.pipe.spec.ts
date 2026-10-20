import { mobileSchema } from "@farsh/contracts";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createZodDto } from "./create-zod-dto.js";
import { ZodValidationException, ZodValidationPipe } from "./zod-validation.pipe.js";

class SignUpDto extends createZodDto(z.object({ mobile: mobileSchema })) {}

describe("ZodValidationPipe", () => {
  const pipe = new ZodValidationPipe();

  it("returns the parsed value: digits normalised, unknown keys stripped", () => {
    const out = pipe.transform(
      { mobile: "۰۹۱۲۳۴۵۶۷۸۹", role: "admin" },
      { type: "body", metatype: SignUpDto },
    );
    expect(out).toEqual({ mobile: "09123456789" });
  });

  it("throws a ZodValidationException on invalid input", () => {
    expect(() => pipe.transform({ mobile: "123" }, { type: "body", metatype: SignUpDto })).toThrow(
      ZodValidationException,
    );
  });

  it("passes through params without a schema and custom decorators", () => {
    expect(pipe.transform("kashan-red", { type: "param", metatype: String })).toBe("kashan-red");
    expect(pipe.transform({ any: 1 }, { type: "custom", metatype: SignUpDto })).toEqual({ any: 1 });
  });
});
