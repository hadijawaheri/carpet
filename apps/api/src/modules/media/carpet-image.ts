import { createHash } from "node:crypto";

import sharp from "sharp";

import { AppException } from "../../common/app-exception.js";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_WIDTH_PX = 2400;
// A 15 MB JPEG can still decode to a huge bitmap; this caps the memory one upload can take
const MAX_INPUT_PIXELS = 80_000_000;

/** File names this API writes, and the only names the media route will serve. */
export const STORED_IMAGE_NAME = /^[a-z0-9-]+-[a-f0-9]{12}\.webp$/;

export interface ProcessedImage {
  data: Buffer;
  /** Width / height of the stored photo, rounded to four places. */
  aspect: number;
}

type ImageType = "jpeg" | "png" | "webp";

/** The browser's Content-Type and the file name are the client's word; the first bytes are the file's. */
export function detectImageType(bytes: Buffer): ImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "png";
  }
  if (
    bytes.subarray(0, 4).toString("latin1") === "RIFF" &&
    bytes.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

/**
 * Re-encodes an upload to WebP. Re-encoding drops EXIF (including the GPS position phones write)
 * and anything appended to the file, so only pixels reach the public folder.
 */
export async function processCarpetImage(bytes: Buffer): Promise<ProcessedImage> {
  if (!detectImageType(bytes)) {
    throw new AppException(415, "VALIDATION_FAILED", "فقط عکس JPEG، PNG یا WebP پذیرفته می‌شود");
  }
  try {
    const { data, info } = await sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS })
      // Phones store portrait photos sideways with an orientation flag; bake it in before EXIF is dropped
      .rotate()
      .resize({ width: MAX_WIDTH_PX, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    return { data, aspect: Math.round((info.width / info.height) * 10_000) / 10_000 };
  } catch {
    // A corrupt or truncated file; libvips' message names internals, so the visitor gets a plain one
    throw new AppException(
      400,
      "VALIDATION_FAILED",
      "این عکس خوانده نشد؛ فایل دیگری را امتحان کنید",
    );
  }
}

/** Content-addressed, so a new photo gets a new URL and browsers can cache each one forever. */
export function storedImageName(slug: string, data: Buffer): string {
  const hash = createHash("sha256").update(data).digest("hex").slice(0, 12);
  return `${slug}-${hash}.webp`;
}
