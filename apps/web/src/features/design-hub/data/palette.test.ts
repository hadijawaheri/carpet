import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { contrastRatio } from "@/lib/contrast";

import { palette, type PaletteToken, textPairs } from "./palette";

const css = readFileSync(new URL("../../../app/globals.css", import.meta.url), "utf8");

function block(selector: RegExp) {
  const body = selector.exec(css)?.[1] ?? "";
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/gi)].map((m) => [m[1], m[2]]),
  );
}

const cssLight = block(/:root,\s*\.light\s*\{([^}]*)\}/);
const cssDark = block(/\n\.dark\s*\{([^}]*)\}/);

describe("palette", () => {
  it.each(Object.entries(palette))("%s matches globals.css", (token, value) => {
    expect(cssLight[token]).toBe(value.light);
    expect(cssDark[token]).toBe(value.dark);
  });

  it.each(textPairs)(
    "%s on %s passes AA in both themes",
    (text: PaletteToken, surface: PaletteToken) => {
      expect(contrastRatio(palette[text].light, palette[surface].light)).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(contrastRatio(palette[text].dark, palette[surface].dark)).toBeGreaterThanOrEqual(4.5);
    },
  );
});
