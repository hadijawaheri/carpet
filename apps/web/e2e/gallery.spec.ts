import { expect, openHome, test } from "./fixtures";

test.describe("gallery", () => {
  test("filters by material", async ({ page }) => {
    await openHome(page);
    const gallery = page.locator("#collection");
    const cards = gallery.locator("article");
    await gallery.getByRole("radio", { name: "ابریشم" }).click();
    await expect(cards).toHaveCount(2);
    await gallery.getByRole("radio", { name: "ماشینی" }).click();
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("سه ترنج");
    await gallery.getByRole("radio", { name: "همه" }).click();
    await expect(cards).toHaveCount(5);
  });

  test("wishlist hearts feed the header count and the wishlist filter", async ({ page }) => {
    await openHome(page);
    const gallery = page.locator("#collection");
    await gallery.getByRole("button", { name: "افزودن کاشان سرخ به برگزیده‌ها" }).click();
    await expect(
      gallery.getByRole("button", { name: "حذف کاشان سرخ از برگزیده‌ها" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: /برگزیده‌ها، ۱ فرش/ })).toBeVisible();
    await gallery.getByRole("radio", { name: /برگزیده/ }).click();
    await expect(gallery.locator("article")).toHaveCount(1);
  });

  test("header search matches Arabic letter variants and reports no results", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "The header search is a desktop control.");
    await openHome(page);
    const search = page
      .getByRole("searchbox", { name: "جست‌وجوی فرش" })
      .or(page.getByRole("textbox", { name: "جست‌وجوی فرش" }));
    // Typed with Arabic kaf and yeh, as many keyboards do.
    await search.fill("كاشان");
    await expect(page.locator("#collection article")).toHaveCount(1);
    await search.fill("ابریشمی نایاب");
    await expect(page.locator("#collection")).toContainText("فرشی با این جست‌وجو پیدا نشد.");
  });

  test("quick view shows facts, switches to 3D and adds to the list", async ({ page }) => {
    await openHome(page);
    await page
      .locator("#collection article")
      .first()
      .getByRole("button", { name: "نگاه سریع" })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("ابعاد");
    await expect(dialog).toContainText("سانتی‌متر");
    await dialog.getByRole("radio", { name: /سه‌بعدی/ }).click();
    await expect(dialog.locator("canvas")).toBeVisible();
    await dialog.getByRole("button", { name: "افزودن به فهرست" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: /فهرست استعلام، ۱ فرش/ })).toBeVisible();
  });

  test("quick view closes with Escape", async ({ page }) => {
    await openHome(page);
    await page
      .locator("#collection article")
      .nth(1)
      .getByRole("button", { name: "نگاه سریع" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
