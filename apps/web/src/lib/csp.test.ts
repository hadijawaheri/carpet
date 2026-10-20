import { describe, expect, it } from "vitest";

import { buildCsp, createNonce } from "./csp";

describe("buildCsp", () => {
  it("allows only nonce-carrying scripts in production", () => {
    const csp = buildCsp("abc", false);
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("adds eval and the HMR socket only in development", () => {
    const csp = buildCsp("abc", true);
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws:");
  });
});

describe("createNonce", () => {
  it("is different on every call", () => {
    expect(createNonce()).not.toBe(createNonce());
  });
});
