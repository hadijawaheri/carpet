import AxeBuilder from "@axe-core/playwright";

import { expect, openHome, openPage, test } from "./fixtures";

test.describe("carpet page", () => {
  test("shows the carpet's facts, metadata and share links", async ({ page, consoleProblems }) => {
    const response = await openPage(page, "/carpets/kashan-red");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "کاشان سرخ" })).toBeVisible();
    await expect(page).toHaveTitle("کاشان سرخ · فرش");
    const main = page.getByRole("main");
    await expect(main).toContainText("۲۰۰ × ۳۴۵ سانتی‌متر");
    await expect(main).toContainText("۵۰ رج");

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toMatch(/\/carpets\/kashan-red$/);
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(ogImage).toMatch(/\/carpets\/kashan-red\.jpg$/);

    const share = page.getByRole("group", { name: "اشتراک‌گذاری این فرش" });
    const whatsapp = new URL(
      (await share.getByRole("link", { name: "واتساپ" }).getAttribute("href"))!,
    );
    expect(whatsapp.searchParams.get("text")).toMatch(
      /فرش کاشان سرخ\nhttp.+\/carpets\/kashan-red$/,
    );
    const telegram = new URL(
      (await share.getByRole("link", { name: "تلگرام" }).getAttribute("href"))!,
    );
    expect(telegram.searchParams.get("url")).toMatch(/\/carpets\/kashan-red$/);
    expect(consoleProblems).toEqual([]);
  });

  test("copies its own address", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "Clipboard permissions are a Chromium grant.");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openPage(page, "/carpets/navy-medallion");
    await page.getByRole("button", { name: "کپی پیوند" }).click();
    await expect(page.getByText("پیوند این فرش کپی شد")).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toMatch(/\/carpets\/navy-medallion$/);
  });

  test("adds the carpet to the inquiry list and suggests the others", async ({ page }) => {
    await openPage(page, "/carpets/medallion-black");
    await page.getByRole("button", { name: "افزودن به فهرست" }).click();
    await expect(page.getByRole("button", { name: "در فهرست شماست" })).toBeDisabled();
    await expect(page.getByRole("button", { name: /فهرست استعلام، ۱ فرش/ })).toBeVisible();

    const more = page.getByRole("region", { name: "فرش‌های دیگر" });
    await expect(more.getByRole("listitem")).toHaveCount(4);
    // Same material comes first
    await expect(more.getByRole("listitem").first()).toContainText("ترنج سرمه‌ای");
    await more.getByRole("link", { name: /ترنج سرمه‌ای/ }).click();
    await expect(page).toHaveURL(/\/carpets\/navy-medallion$/);
    await expect(page.getByRole("heading", { level: 1, name: "ترنج سرمه‌ای" })).toBeVisible();
    // The list lives in the shared layout, so it survives the move
    await expect(page.getByRole("button", { name: /فهرست استعلام، ۱ فرش/ })).toBeVisible();
  });

  test("is reached from the gallery and from the quick view, keeping the wishlist", async ({
    page,
  }) => {
    await openHome(page);
    const gallery = page.locator("#collection");
    await gallery.getByRole("button", { name: "افزودن کاشان سرخ به برگزیده‌ها" }).click();
    await gallery.getByRole("link", { name: "کاشان سرخ" }).click();
    await expect(page).toHaveURL(/\/carpets\/kashan-red$/);
    await expect(page.getByRole("button", { name: /برگزیده‌ها، ۱ فرش/ })).toBeVisible();

    await page.getByRole("link", { name: "مجموعه" }).first().click();
    await expect(page).toHaveURL(/\/#collection$/);
    await page
      .locator("#collection article")
      .nth(2)
      .getByRole("button", { name: "نگاه سریع" })
      .click();
    await page.getByRole("dialog").getByRole("link", { name: "صفحه‌ی کامل این فرش" }).click();
    await expect(page).toHaveURL(/\/carpets\/navy-medallion$/);
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("header search leads back to the gallery with the query", async ({ page, isMobile }) => {
    test.skip(isMobile, "The header search is a desktop control.");
    await openPage(page, "/carpets/kashan-red");
    await page.getByRole("searchbox", { name: "جست‌وجوی فرش" }).fill("ترنج");
    await expect(page).toHaveURL(/\/\?q=%D8%AA.*#collection$/);
    await expect(page.locator("#collection article")).toHaveCount(3);
  });

  test("shows the not-found page, unindexed, for an unknown or malformed slug", async ({
    page,
  }) => {
    for (const path of ["/carpets/no-such-carpet", "/carpets/KASHAN"]) {
      await openPage(page, path);
      await expect(page.getByRole("heading", { name: "این صفحه پیدا نشد" })).toBeVisible();
      await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
        "content",
        "noindex",
      );
    }
  });

  test("has no WCAG A/AA violations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openPage(page, "/carpets/three-medallion");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});
