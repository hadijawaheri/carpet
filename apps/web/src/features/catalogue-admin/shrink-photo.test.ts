import { afterEach, describe, expect, it, vi } from "vitest";

import { SEND_AS_IS_BYTES, shrinkPhoto } from "./shrink-photo";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("shrinkPhoto", () => {
  it("sends a photo that fits the upload limit untouched", async () => {
    const decode = vi.fn();
    vi.stubGlobal("createImageBitmap", decode);
    const file = new File([new Uint8Array(1024)], "small.jpg", { type: "image/jpeg" });
    expect(await shrinkPhoto(file)).toBe(file);
    expect(decode).not.toHaveBeenCalled();
  });

  it("sends a large photo the browser cannot decode as is, for the API to explain", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new Error("HEIC")));
    const file = new File([new Uint8Array(SEND_AS_IS_BYTES + 1)], "big.heic", {
      type: "image/heic",
    });
    expect(await shrinkPhoto(file)).toBe(file);
  });
});
