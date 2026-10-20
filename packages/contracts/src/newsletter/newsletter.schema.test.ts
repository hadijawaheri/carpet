import { describe, expect, it } from "vitest";

import { subscribeNewsletterSchema } from "./newsletter.schema";

describe("subscribeNewsletterSchema", () => {
  it("trims and lower-cases the address", () => {
    expect(subscribeNewsletterSchema.parse({ email: "  Hadi@Example.COM " }).email).toBe(
      "hadi@example.com",
    );
  });

  it("rejects a malformed address", () => {
    expect(subscribeNewsletterSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});
