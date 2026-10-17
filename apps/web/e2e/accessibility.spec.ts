import AxeBuilder from "@axe-core/playwright";

import { expect, openHome, test } from "./fixtures";

test.describe("accessibility", () => {
  test("the home page has no WCAG A/AA violations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openHome(page);
    // Walk the page so lazy sections and the room panel are mounted before the scan.
    await page.locator("#visualizer").scrollIntoViewIfNeeded();
    await page.locator("footer").scrollIntoViewIfNeeded();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const summary = results.violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
    );
    expect(summary).toEqual([]);
  });

  test("dialogs have no WCAG A/AA violations", async ({ page }) => {
    await openHome(page);
    await page
      .locator("#collection article")
      .first()
      .getByRole("button", { name: "نگاه سریع" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const quickView = await new AxeBuilder({ page })
      .include("[role=dialog]")
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(quickView.violations.map((v) => v.id)).toEqual([]);
    await page.getByRole("dialog").getByRole("button", { name: "پرسیدن از کارشناس" }).click();
    await expect(page.getByRole("dialog", { name: "فهرست انتخاب شما" })).toBeVisible();
    const drawer = await new AxeBuilder({ page })
      .include("[role=dialog]")
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(drawer.violations.map((v) => v.id)).toEqual([]);
  });

  test("keyboard users can reach the room controls in order", async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard walk is a desktop concern.");
    await openHome(page);
    // Focus only once the scene has mounted; until then the stage is still being replaced.
    await expect(page.getByTestId("room-stage").locator("canvas")).toBeVisible();
    await page.getByTestId("room-stage").focus();
    await expect(page.getByTestId("room-stage")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("radio", { name: "نمای کلی" })).toBeFocused();
  });
});
