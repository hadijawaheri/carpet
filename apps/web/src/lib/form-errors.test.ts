import { beforeEach, describe, expect, it, vi } from "vitest";

const toastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error: toastError } }));

import { ApiError } from "./api/parse";
import { showServerError } from "./form-errors";

describe("showServerError", () => {
  beforeEach(() => toastError.mockClear());

  it("puts the API's validation issues on the matching fields", () => {
    const setError = vi.fn();
    const error = new ApiError(400, "VALIDATION_FAILED", "درخواست معتبر نیست", [
      { path: "mobile", message: "شماره موبایل معتبر نیست" },
    ]);
    showServerError(error, setError, ["name", "mobile"]);
    expect(setError).toHaveBeenCalledWith("mobile", { message: "شماره موبایل معتبر نیست" });
    expect(toastError).not.toHaveBeenCalled();
  });

  it("toasts anything the form has no field for", () => {
    const setError = vi.fn();
    showServerError(new ApiError(429, "RATE_LIMITED", "تعداد درخواست‌ها زیاد است"), setError, [
      "mobile",
    ]);
    showServerError(new TypeError("Failed to fetch"), setError, ["mobile"]);
    expect(setError).not.toHaveBeenCalled();
    expect(toastError.mock.calls).toEqual([
      ["تعداد درخواست‌ها زیاد است"],
      ["خطای غیرمنتظره‌ای رخ داد"],
    ]);
  });

  it("keeps a general error on the form when asked to stay inline", () => {
    const setError = vi.fn();
    showServerError(new ApiError(503, "INTERNAL", "سرویس در دسترس نیست"), setError, ["mobile"], {
      inline: true,
    });
    expect(setError).toHaveBeenCalledWith("root.server", { message: "سرویس در دسترس نیست" });
    expect(toastError).not.toHaveBeenCalled();
  });
});
