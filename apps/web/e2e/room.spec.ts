import type { Locator, Page } from "@playwright/test";

import { expect, openHome, test } from "./fixtures";

/** Opens the room preview with motion reduced, so the carpet lies flat and the camera jumps. */
async function openRoom(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page);
  const section = page.locator("#visualizer");
  await section.scrollIntoViewIfNeeded();
  const stage = page.getByTestId("room-stage");
  await expect(stage.locator("canvas")).toBeVisible();
  return { section, stage };
}

/** Fraction of sampled pixels that differ from the first one: 0 means a blank canvas. */
async function canvasVariety(stage: Locator) {
  return stage.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const copy = document.createElement("canvas");
    copy.width = 64;
    copy.height = 40;
    const context = copy.getContext("2d")!;
    context.drawImage(canvas, 0, 0, 64, 40);
    const data = context.getImageData(0, 0, 64, 40).data;
    let different = 0;
    for (let i = 4; i < data.length; i += 4) {
      const delta =
        Math.abs(data[i]! - data[0]!) +
        Math.abs(data[i + 1]! - data[1]!) +
        Math.abs(data[i + 2]! - data[2]!);
      if (delta > 30) different++;
    }
    return different / (data.length / 4);
  });
}

const rugX = async (stage: Locator) => Number(await stage.getAttribute("data-rug-x"));
const rugZ = async (stage: Locator) => Number(await stage.getAttribute("data-rug-z"));

test.describe("room preview", () => {
  test("draws a furnished room with the carpet in it", async ({ page, consoleProblems }) => {
    const { stage } = await openRoom(page);
    await expect.poll(() => canvasVariety(stage), { timeout: 30_000 }).toBeGreaterThan(0.3);
    await expect(stage).toHaveAttribute("aria-label", /نشیمن.*کاشان سرخ/);
    expect(consoleProblems).toEqual([]);
  });

  test("switches rooms, including the formal salon with its own size limits", async ({ page }) => {
    const { section, stage } = await openRoom(page);
    for (const room of ["سالن پذیرایی", "اتاق خواب", "ناهارخوری", "اتاق کار", "نشیمن"]) {
      await section.getByRole("button", { name: room }).click();
      await expect(section.getByRole("button", { name: room })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(stage).toHaveAttribute("aria-label", new RegExp(room));
    }
    await section.getByRole("button", { name: "سالن پذیرایی" }).click();
    const width = section.getByRole("slider", { name: "عرض" });
    await expect(width).toHaveAttribute("min", "5.5");
    await expect(width).toHaveValue("7");
    await expect(section).toContainText("مساحت ۷۰ متر مربع");
  });

  test("grades the fit as the room shrinks round the carpet", async ({ page }) => {
    const { section } = await openRoom(page);
    const readout = page.getByTestId("fit-readout");
    await expect(readout).toContainText("اندازه‌ی متناسب");
    await section.getByRole("slider", { name: "عرض" }).fill("3.6");
    await expect(readout).toContainText("تقریباً دیوار به دیوار");
    await section.getByRole("slider", { name: "عرض" }).fill("3");
    await expect(readout).toContainText("از اتاق بزرگ‌تر است");
    await section.getByRole("button", { name: "اندازه‌ی پیش‌فرض" }).click();
    await expect(readout).toContainText("اندازه‌ی متناسب");
  });

  test("changes wall paint, floor and light", async ({ page }) => {
    const { section, stage } = await openRoom(page);
    await section.getByRole("button", { name: "سرمه‌ای", exact: true }).click();
    await expect(section.getByRole("button", { name: "سرمه‌ای", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await section.getByRole("button", { name: "سنگ مرمر" }).click();
    await expect(section.getByRole("button", { name: "سنگ مرمر" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await section.getByRole("radio", { name: "شب" }).click();
    await expect(section.getByRole("radio", { name: "شب" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect.poll(() => canvasVariety(stage), { timeout: 30_000 }).toBeGreaterThan(0.2);
  });

  test("moves and turns the carpet from the keyboard and the toolbar", async ({ page }) => {
    const { section, stage } = await openRoom(page);
    const startX = await rugX(stage);
    await stage.focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect.poll(() => rugX(stage)).toBeCloseTo(startX - 0.2, 5);
    await page.keyboard.press("r");
    await expect(stage).toHaveAttribute("data-rug-turns", "2");
    await section.getByRole("button", { name: "چرخاندن ۹۰ درجه" }).click();
    await expect(stage).toHaveAttribute("data-rug-turns", "3");
    await section.getByRole("button", { name: "جای پیشنهادی" }).click();
    await expect(stage).toHaveAttribute("data-rug-turns", "1");
    await expect.poll(() => rugX(stage)).toBeCloseTo(startX, 5);
  });

  test("drags the carpet across the floor", async ({ page }) => {
    const { section, stage } = await openRoom(page);
    await section.getByRole("radio", { name: "از بالا" }).click();
    // Let the plan camera settle: it jumps under reduced motion but needs a frame or two.
    await page.waitForTimeout(1500);
    const box = (await stage.boundingBox())!;
    const startX = await rugX(stage);
    const startZ = await rugZ(stage);
    // Plan view: the camera looks straight down at the room centre; see CameraRig in room-scene.
    const aspect = box.width / box.height;
    const fov = (40 * Math.PI) / 180;
    const fit = Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * aspect));
    const span = Math.max(4.6 / Math.min(1, aspect), 5.6) / 2 + 0.6;
    const cameraHeight = 2.8 + span / Math.tan(fit / 2);
    const pixelsPerMetre = box.height / 2 / (cameraHeight * Math.tan(fov / 2));
    const x = box.x + box.width / 2 + startX * pixelsPerMetre;
    const y = box.y + box.height / 2 + startZ * pixelsPerMetre;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 40, y, { steps: 4 });
    await page.mouse.move(x - 0.6 * pixelsPerMetre, y, { steps: 6 });
    await page.mouse.up();
    await expect.poll(() => rugX(stage)).toBeLessThan(startX - 0.4);
    expect(Math.abs((await rugZ(stage)) - startZ)).toBeLessThan(0.1);
  });

  test("saves a picture of the room", async ({ page }) => {
    const { section } = await openRoom(page);
    const download = page.waitForEvent("download");
    await section.getByRole("button", { name: "ذخیره‌ی تصویر" }).click();
    expect((await download).suggestedFilename()).toBe("farsh-kashan-red-living.jpg");
  });

  test("asks about the carpet on show", async ({ page }) => {
    const { section } = await openRoom(page);
    await section.getByRole("button", { name: "ترنج سرمه‌ای" }).click();
    await section.getByRole("button", { name: "استعلام همین فرش" }).click();
    const drawer = page.getByRole("dialog", { name: "فهرست انتخاب شما" });
    await expect(drawer).toContainText("ترنج سرمه‌ای");
  });
});
