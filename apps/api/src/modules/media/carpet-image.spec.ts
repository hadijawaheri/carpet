import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  detectImageType,
  processCarpetImage,
  STORED_IMAGE_NAME,
  storedImageName,
} from "./carpet-image.js";

const photo = (width: number, height: number, format: "jpeg" | "png" | "webp"): Promise<Buffer> =>
  sharp({ create: { width, height, channels: 3, background: "#7a2e2a" } })
    .toFormat(format)
    .toBuffer();

describe("detectImageType", () => {
  it("reads JPEG, PNG and WebP from their first bytes", async () => {
    expect(detectImageType(await photo(4, 4, "jpeg"))).toBe("jpeg");
    expect(detectImageType(await photo(4, 4, "png"))).toBe("png");
    expect(detectImageType(await photo(4, 4, "webp"))).toBe("webp");
  });

  it("rejects anything else, whatever it claims to be", () => {
    expect(detectImageType(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
    expect(detectImageType(Buffer.from("GIF89a"))).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });
});

describe("processCarpetImage", () => {
  it("re-encodes to WebP and keeps the aspect", async () => {
    const { data, aspect } = await processCarpetImage(await photo(600, 900, "jpeg"));
    expect(detectImageType(data)).toBe("webp");
    expect(aspect).toBe(0.6667);
    const meta = await sharp(data).metadata();
    expect([meta.width, meta.height]).toEqual([600, 900]);
  });

  it("shrinks a wide photo to 2400 px", async () => {
    const { data, aspect } = await processCarpetImage(await photo(3000, 2000, "png"));
    const meta = await sharp(data).metadata();
    expect([meta.width, meta.height]).toEqual([2400, 1600]);
    expect(aspect).toBe(1.5);
  });

  it("applies the EXIF orientation and drops the metadata", async () => {
    // Orientation 6 means the camera held it sideways: stored 400×200, shown 200×400
    const sideways = await sharp({
      create: { width: 400, height: 200, channels: 3, background: "#123456" },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const { data, aspect } = await processCarpetImage(sideways);
    const meta = await sharp(data).metadata();
    expect([meta.width, meta.height]).toEqual([200, 400]);
    expect(aspect).toBe(0.5);
    expect(meta.exif).toBeUndefined();
  });

  it("refuses a file that is not a photo, with a Persian 415", async () => {
    await expect(processCarpetImage(Buffer.from("not an image"))).rejects.toMatchObject({
      status: 415,
      code: "VALIDATION_FAILED",
    });
  });

  it("refuses a truncated photo with a Persian 400", async () => {
    const jpeg = await photo(64, 64, "jpeg");
    await expect(processCarpetImage(jpeg.subarray(0, 40))).rejects.toMatchObject({
      status: 400,
      message: "این عکس خوانده نشد؛ فایل دیگری را امتحان کنید",
    });
  });
});

describe("storedImageName", () => {
  it("names a photo by its content", () => {
    const name = storedImageName(Buffer.from("pixels"));
    expect(name).toMatch(STORED_IMAGE_NAME);
    expect(storedImageName(Buffer.from("pixels"))).toBe(name);
    expect(storedImageName(Buffer.from("other"))).not.toBe(name);
  });

  it("serves only names it could have written", () => {
    expect(STORED_IMAGE_NAME.test("../../etc/passwd")).toBe(false);
    expect(STORED_IMAGE_NAME.test("0123456789abcdef01234567.webp")).toBe(true);
    expect(STORED_IMAGE_NAME.test("0123456789abcdef01234567.webp/..")).toBe(false);
    expect(STORED_IMAGE_NAME.test("kashan-red.jpg")).toBe(false);
  });
});
