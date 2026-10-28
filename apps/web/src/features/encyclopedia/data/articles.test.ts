import { articleSchema } from "@farsh/contracts";
import { describe, expect, it } from "vitest";

import { articles, getArticle } from "./articles";

describe("encyclopedia articles", () => {
  it("are valid, uniquely addressed drafts", () => {
    for (const article of articles) {
      expect(articleSchema.safeParse(article).success).toBe(true);
      expect(article.isDraft).toBe(true);
    }
    expect(new Set(articles.map((a) => a.slug)).size).toBe(articles.length);
  });

  it("give every section a unique heading, the key each section renders under", () => {
    for (const article of articles) {
      const headings = article.sections.map((s) => s.heading);
      expect(new Set(headings).size).toBe(headings.length);
    }
  });

  it("estimate reading time from the text", () => {
    for (const article of articles) {
      expect(article.readingMinutes).toBeGreaterThanOrEqual(1);
      expect(article.readingMinutes).toBeLessThanOrEqual(5);
    }
  });

  it("are found by slug, and unknown slugs are not", () => {
    expect(getArticle("raj-shaneh-density")?.topic).toBe("density");
    expect(getArticle("no-such-article")).toBeNull();
  });
});
