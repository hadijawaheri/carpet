const MAX_WIDTH_PX = 2400;
// Vercel's rewrite refuses request bodies over 4.5 MB, so larger photos are shrunk in the browser
export const SEND_AS_IS_BYTES = 4 * 1024 * 1024;

/**
 * A phone photo can be 10 MB or more; this re-encodes it to a JPEG the API will shrink further anyway.
 * A photo the browser cannot decode (HEIC on most browsers) is sent as is, and the API's Persian
 * error explains which types it takes.
 */
export async function shrinkPhoto(file: File): Promise<Blob> {
  if (file.size <= SEND_AS_IS_BYTES) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  const scale = Math.min(1, MAX_WIDTH_PX / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  return blob ?? file;
}
