import { useEffect, useState } from "react";

import { dominantColors, type Swatch } from "@/lib/image-palette";

const SAMPLE_WIDTH = 72;

/** The colours of a carpet photo, or null while the photo is still being read. */
export function useCarpetSwatches(image: string): Swatch[] | null {
  const [result, setResult] = useState<{ image: string; swatches: Swatch[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const picture = new window.Image();
    picture.decoding = "async";
    picture.onload = () => {
      if (cancelled) return;
      const height = Math.max(
        1,
        Math.round((SAMPLE_WIDTH * picture.naturalHeight) / picture.naturalWidth),
      );
      const canvas = document.createElement("canvas");
      canvas.width = SAMPLE_WIDTH;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        setResult({ image, swatches: [] });
        return;
      }
      ctx.drawImage(picture, 0, 0, SAMPLE_WIDTH, height);
      setResult({
        image,
        swatches: dominantColors(ctx.getImageData(0, 0, SAMPLE_WIDTH, height).data, 8),
      });
    };
    picture.onerror = () => {
      if (!cancelled) setResult({ image, swatches: [] });
    };
    picture.src = image;
    return () => {
      cancelled = true;
    };
  }, [image]);

  return result?.image === image ? result.swatches : null;
}
