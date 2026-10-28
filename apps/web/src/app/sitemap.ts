import type { MetadataRoute } from "next";

import { articles } from "@/features/encyclopedia";
import { getCarpets } from "@/features/showroom";
import { paths } from "@/lib/paths";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const carpets = await getCarpets();
  return [
    { url: absoluteUrl(paths.home), changeFrequency: "monthly", priority: 1 },
    ...carpets.map((carpet) => ({
      url: absoluteUrl(paths.carpet(carpet.slug)),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl(paths.encyclopedia), changeFrequency: "monthly", priority: 0.6 },
    ...articles.map((article) => ({
      url: absoluteUrl(paths.article(article.slug)),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
