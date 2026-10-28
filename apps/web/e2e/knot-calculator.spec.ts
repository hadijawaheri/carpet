import AxeBuilder from "@axe-core/playwright";

import { expect, openPage, test } from "./fixtures";

test.describe("knot calculator", () => {
  test("is linked from the encyclopedia and calculates both constructions", async ({
    page,
    consoleProblems,
  }) => {
    await openPage(page, "/encyclopedia");
    await page.getByRole("link", { name: /ماشین‌حساب رج و تراکم گره/ }).click();
    await expect(page).toHaveURL(/\/encyclopedia\/knot-calculator$/);
    await expect(page).toHaveTitle("ماشین‌حساب رج و تراکم گره · فرش");

    await page.getByLabel("رج").fill("۷۰");
    await expect(page.getByRole("main")).toContainText("حدود ۱٬۰۰۰٬۰۰۰");
    await expect(page.getByRole("main")).toContainText("حدود ۶٬۰۰۰٬۰۰۰");

    await page.getByRole("radio", { name: "ماشینی، با شانه و تراکم" }).click();
    await expect(page.getByRole("main")).toContainText("۴٬۳۲۰٬۰۰۰");
    await page.getByLabel("شانه").fill("abc");
    await expect(page.getByLabel("شانه")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("فقط عدد صحیح بنویسید")).toBeVisible();
    expect(consoleProblems).toEqual([]);
  });

  test("links to the article that explains the units", async ({ page }) => {
    await openPage(page, "/encyclopedia/knot-calculator");
    await page.getByRole("link", { name: "نوشته‌ی رج، شانه و تراکم" }).click();
    await expect(page).toHaveURL(/\/encyclopedia\/raj-shaneh-density$/);
  });

  test("has no WCAG A/AA violations, valid or not", async ({ page }) => {
    await openPage(page, "/encyclopedia/knot-calculator");
    await page.getByLabel("رج").fill("5");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});
