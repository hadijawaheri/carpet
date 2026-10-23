import { describe, expect, it } from "vitest";

import { safeRedirect } from "./safe-redirect";

describe("safeRedirect", () => {
  it.each([
    ["/dashboard/profile", "/dashboard/profile"],
    ["/#collection", "/#collection"],
    [null, "/dashboard"],
    [undefined, "/dashboard"],
    ["", "/dashboard"],
    ["https://evil.example", "/dashboard"],
    ["//evil.example", "/dashboard"],
    ["/\\evil.example", "/dashboard"],
    ["javascript:alert(1)", "/dashboard"],
  ])("%s → %s", (next, expected) => {
    expect(safeRedirect(next)).toBe(expected);
  });

  it("uses the given fallback", () => {
    expect(safeRedirect("https://x", "/")).toBe("/");
  });
});
