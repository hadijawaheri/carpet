import { describe, expect, it } from "vitest";

import { ConsoleSmsProvider } from "./console-sms.provider.js";
import { createSmsProvider } from "./sms.module.js";

describe("createSmsProvider", () => {
  it("returns the console provider in development", () => {
    expect(createSmsProvider("console")).toBeInstanceOf(ConsoleSmsProvider);
  });

  it("rejects a provider that has no implementation", () => {
    expect(() => createSmsProvider("melipayamak")).toThrow(/not implemented/);
  });
});
