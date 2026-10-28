import AxeBuilder from "@axe-core/playwright";

import { expect, openPage, test } from "./fixtures";

test.describe("certificate", () => {
  test("is reached from the carpet page and says it is not yet a proof", async ({
    page,
    consoleProblems,
  }) => {
    await openPage(page, "/carpets/kashan-red");
    await page.getByRole("link", { name: "شناسنامه‌ی این فرش" }).click();
    await expect(page).toHaveURL(/\/carpets\/kashan-red\/certificate$/);
    await expect(page).toHaveTitle("شناسنامه‌ی کاشان سرخ · فرش");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    const certificate = page.getByRole("article");
    await expect(certificate.getByRole("heading", { level: 1 })).toHaveText("کاشان سرخ");
    await expect(certificate).toContainText("پیش‌نمایش: مشخصات اصالت این فرش هنوز تأیید");
    await expect(certificate).toContainText("۲۰۰ × ۳۴۵ سانتی‌متر");
    await expect(certificate.getByText("ثبت نشده", { exact: true })).toHaveCount(4);

    const qr = certificate.getByRole("img", { name: "کد QR نشانی همین شناسنامه" });
    await expect(qr).toBeVisible();
    expect(await qr.getAttribute("src")).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(await qr.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    expect(consoleProblems).toEqual([]);
  });

  test("prints without the site's header and footer", async ({ page }) => {
    await openPage(page, "/carpets/navy-medallion/certificate");
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("header").first()).toBeHidden();
    await expect(page.locator("footer")).toBeHidden();
    await expect(page.getByRole("button", { name: "چاپ شناسنامه" })).toBeHidden();
    await expect(page.getByRole("article")).toBeVisible();
  });

  test("shows the not-found page for an unknown carpet", async ({ page }) => {
    await openPage(page, "/carpets/no-such-carpet/certificate");
    await expect(page.getByRole("heading", { name: "این صفحه پیدا نشد" })).toBeVisible();
  });

  test("has no WCAG A/AA violations", async ({ page }) => {
    await openPage(page, "/carpets/three-medallion/certificate");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});
