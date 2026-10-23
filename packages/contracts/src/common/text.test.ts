import { describe, expect, it } from "vitest";

import { optionalText } from "./text";

describe("optionalText", () => {
  const schema = optionalText(5);

  it.each([
    [undefined, undefined],
    ["", undefined],
    ["   ", undefined],
    [" علی ", "علی"],
  ])("%j → %j", (input, output) => {
    expect(schema.parse(input)).toBe(output);
  });

  it("still caps the length", () => {
    expect(schema.safeParse("abcdef").success).toBe(false);
  });
});
