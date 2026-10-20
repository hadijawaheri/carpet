import { describe, expect, it } from "vitest";

import { ApiError, getErrorMessage, parseResponse } from "./parse";

describe("parseResponse", () => {
  it("returns the JSON body of a successful response", async () => {
    const res = new Response(JSON.stringify({ data: { id: "1" } }), { status: 201 });
    await expect(parseResponse(res)).resolves.toEqual({ data: { id: "1" } });
  });

  it("returns undefined for 204", async () => {
    await expect(parseResponse(new Response(null, { status: 204 }))).resolves.toBeUndefined();
  });

  it("throws an ApiError carrying the API's Persian message and code", async () => {
    const body = { statusCode: 429, code: "RATE_LIMITED", message: "کمی بعد دوباره تلاش کنید" };
    const error = await parseResponse(new Response(JSON.stringify(body), { status: 429 })).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("RATE_LIMITED");
    expect(getErrorMessage(error)).toBe("کمی بعد دوباره تلاش کنید");
  });

  it("falls back to a generic message when the body is not JSON", async () => {
    const error = await parseResponse(new Response("<html>", { status: 502 })).catch(
      (e: unknown) => e,
    );
    expect((error as ApiError).code).toBe("INTERNAL");
    expect(getErrorMessage(new TypeError("network"))).toBe("خطای غیرمنتظره‌ای رخ داد");
  });
});
