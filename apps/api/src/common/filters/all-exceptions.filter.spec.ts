import { ForbiddenException, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { AppException } from "../app-exception.js";
import { ZodValidationException } from "../zod/zod-validation.pipe.js";
import { toErrorBody } from "./all-exceptions.filter.js";

describe("toErrorBody", () => {
  it("lists field errors for a validation failure", () => {
    const result = z.object({ name: z.string().min(2, "نام کوتاه است") }).safeParse({ name: "a" });
    if (result.success) throw new Error("expected failure");
    const body = toErrorBody(new ZodValidationException(result.error), "req-1");
    expect(body).toMatchObject({
      statusCode: 400,
      code: "VALIDATION_FAILED",
      requestId: "req-1",
      details: [{ path: "name", message: "نام کوتاه است" }],
    });
  });

  it("keeps the code and details of an AppException", () => {
    const body = toErrorBody(new AppException(400, "OTP_INVALID", "کد تأیید نادرست است", ["x"]));
    expect(body).toMatchObject({ statusCode: 400, code: "OTP_INVALID", details: ["x"] });
  });

  it("keeps a Persian message and maps the status to a code", () => {
    expect(toErrorBody(new NotFoundException("فرش یافت نشد"))).toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "فرش یافت نشد",
    });
  });

  it("replaces English framework messages with Persian ones", () => {
    expect(toErrorBody(new NotFoundException("Cannot GET /nope")).message).toBe(
      "مورد درخواستی یافت نشد",
    );
    expect(toErrorBody(new ForbiddenException()).code).toBe("FORBIDDEN");
    expect(toErrorBody(new ThrottlerException())).toMatchObject({
      statusCode: 429,
      code: "RATE_LIMITED",
      message: "تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید",
    });
  });

  it("never leaks internals of a 5xx", () => {
    expect(toErrorBody(new Error("db password is hunter2"))).toEqual({
      statusCode: 500,
      code: "INTERNAL",
      message: "خطای غیرمنتظره‌ای رخ داد",
      requestId: undefined,
    });
    expect(toErrorBody(new ServiceUnavailableException({ status: "error" }))).toMatchObject({
      statusCode: 503,
      code: "INTERNAL",
      message: "خطای غیرمنتظره‌ای رخ داد",
    });
  });
});
