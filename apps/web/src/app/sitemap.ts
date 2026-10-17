import type { MetadataRoute } from "next";

import { paths } from "@/lib/paths";
import { defaultMetadata } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = new URL(String(defaultMetadata.metadataBase ?? "http://localhost:7782"));
  return [
    { url: new URL(paths.home, base).href, changeFrequency: "monthly", priority: 1 },
    { url: new URL(paths.designHub, base).href, changeFrequency: "monthly", priority: 0.5 },
  ];
}
