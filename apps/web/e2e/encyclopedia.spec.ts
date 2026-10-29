import AxeBuilder from "@axe-core/playwright";

import { expect, openPage, test } from "./fixtures";

test.describe("encyclopedia", () => {
  test("lists the articles and opens one", async ({ page, consoleProblems }) => {
    await openPage(page, "/encyclopedia");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("گره به گره، از نزدیک");
    await expect(page.getByText(/^پیش‌نویس:/)).toHaveCount(0);
    const cards = page.getByRole("main").getByRole("listitem");
    await expect(cards).toHaveCount(5);

    await page.getByRole("link", { name: /رج، شانه و تراکم/ }).click();
    await expect(page).toHaveURL(/\/encyclopedia\/raj-shaneh-density$/);
    await expect(page).toHaveTitle("رج، شانه و تراکم؛ زبان شمارش گره · فرش");
    await expect(page.getByRole("heading", { level: 2, name: "رج در فرش دستباف" })).toBeVisible();
    await expect(page.getByText(/^پیش‌نویس:/)).toHaveCount(0);

    const others = page.getByRole("region", { name: "نوشته‌های دیگر" });
    await expect(others.getByRole("listitem")).toHaveCount(4);
    await others.getByRole("link", { name: "گره فارسی و گره ترکی" }).click();
    await expect(page).toHaveURL(/\/encyclopedia\/persian-and-turkish-knots$/);
    expect(consoleProblems).toEqual([]);
  });

  test("is in the header", async ({ page, isMobile }) => {
    test.skip(isMobile, "The header's section links are a desktop control.");
    await openPage(page, "/");
    await page
      .getByRole("navigation", { name: "بخش‌های صفحه" })
      .getByRole("link", { name: "دانشنامه" })
      .click();
    await expect(page).toHaveURL(/\/encyclopedia$/);
  });

  test("shows the not-found page for an unknown article", async ({ page }) => {
    await openPage(page, "/encyclopedia/no-such-article");
    await expect(page.getByRole("heading", { name: "این صفحه پیدا نشد" })).toBeVisible();
  });

  test("has no WCAG A/AA violations", async ({ page }) => {
    for (const path of ["/encyclopedia", "/encyclopedia/pile-materials"]) {
      await openPage(page, path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(results.violations.map((v) => v.id)).toEqual([]);
    }
  });
});
