import type { MetadataRoute } from "next";

import { defaultMetadata } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = String(defaultMetadata.metadataBase ?? "http://localhost:7782");
  return [{ url: base, changeFrequency: "monthly", priority: 1 }];
}
