import { expect, openHome, test } from "./fixtures";

test.describe("home page", () => {
  test("renders in Persian, right to left, with the catalogue", async ({
    page,
    consoleProblems,
  }) => {
    await openHome(page);
    await expect(page).toHaveTitle(/فرش/);
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("میراث");
    await expect(page.locator("#collection article")).toHaveCount(5);
    await expect(
      page.getByRole("heading", { name: "فرش را در خانه‌ی خودتان ببینید" }),
    ).toBeVisible();
    expect(consoleProblems).toEqual([]);
  });

  test("never scrolls sideways", async ({ page }) => {
    await openHome(page);
    for (const id of ["#top", "#collection", "#visualizer", "#heritage"]) {
      await page.locator(id).first().scrollIntoViewIfNeeded();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow near ${id}`).toBeLessThanOrEqual(0);
    }
  });

  test("hero buttons jump to the gallery and the room preview", async ({ page }) => {
    await openHome(page);
    await page.locator("#top").getByRole("link").filter({ hasText: "پیش‌نمایش" }).first().click();
    await expect(page).toHaveURL(/#visualizer$/);
    await expect(page.locator("#visualizer h2")).toBeInViewport();
  });

  test("the 3D hero carpet renders and the photo stays as fallback", async ({ page }) => {
    await openHome(page);
    const stage = page.locator("#top canvas");
    await expect(stage).toBeVisible();
    await expect(page.locator("#top [role=img]").first()).toHaveAttribute("aria-label", /فرش/);
  });

  test("unknown pages show the Persian not-found page", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    await expect(page.locator("body")).toContainText("پیدا نشد");
  });
});
