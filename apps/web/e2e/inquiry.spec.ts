import { expect, openHome, test } from "./fixtures";

async function openDrawerWithCarpet(page: import("@playwright/test").Page) {
  await page
    .locator("#collection article")
    .first()
    .getByRole("button", { name: "نگاه سریع" })
    .click();
  await page.getByRole("dialog").getByRole("button", { name: "پرسیدن از کارشناس" }).click();
  const drawer = page.getByRole("dialog", { name: "فهرست انتخاب شما" });
  await expect(drawer).toBeVisible();
  return drawer;
}

test.describe("inquiry", () => {
  test("validates in Persian before sending", async ({ page }) => {
    await openHome(page);
    const drawer = await openDrawerWithCarpet(page);
    await drawer.getByRole("button", { name: "ثبت درخواست استعلام" }).click();
    await expect(drawer.getByLabel("نام")).toHaveAttribute("aria-invalid", "true");
    await drawer.getByLabel("نام").fill("هادی");
    await drawer.getByLabel("شماره موبایل").fill("12345");
    await drawer.getByRole("button", { name: "ثبت درخواست استعلام" }).click();
    await expect(drawer.getByLabel("شماره موبایل")).toHaveAttribute("aria-invalid", "true");
    await expect(drawer.getByLabel("نام")).toHaveAttribute("aria-invalid", "false");
  });

  test("sends the carpet and a normalised mobile number", async ({ page }) => {
    await openHome(page);
    let body: unknown = null;
    await page.route("**/api/inquiries", async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        json: {
          data: {
            id: "6650f0c2a1b2c3d4e5f60718",
            name: "هادی",
            mobile: "09123456789",
            carpetSlugs: ["medallion-black"],
            status: "new",
            createdAt: new Date().toISOString(),
          },
        },
      });
    });
    const drawer = await openDrawerWithCarpet(page);
    await drawer.getByLabel("نام").fill("هادی");
    // Persian digits, as a phone keyboard types them.
    await drawer.getByLabel("شماره موبایل").fill("۰۹۱۲۳۴۵۶۷۸۹");
    await drawer.getByLabel("پیام (اختیاری)").fill("برای پذیرایی");
    await drawer.getByRole("button", { name: "ثبت درخواست استعلام" }).click();
    await expect(drawer.getByRole("status")).toContainText("درخواست شما ثبت شد");
    expect(body).toMatchObject({ name: "هادی", mobile: "09123456789", message: "برای پذیرایی" });
    expect((body as { carpetSlugs: string[] }).carpetSlugs).toHaveLength(1);
  });

  test("shows the server's message when sending fails", async ({ page }) => {
    await openHome(page);
    await page.route("**/api/inquiries", (route) =>
      route.fulfill({
        status: 429,
        json: {
          statusCode: 429,
          code: "RATE_LIMITED",
          message: "درخواست‌ها زیاد است؛ کمی بعد دوباره امتحان کنید",
        },
      }),
    );
    const drawer = await openDrawerWithCarpet(page);
    await drawer.getByLabel("نام").fill("هادی");
    await drawer.getByLabel("شماره موبایل").fill("09123456789");
    await drawer.getByRole("button", { name: "ثبت درخواست استعلام" }).click();
    await expect(drawer.getByRole("alert")).toContainText("کمی بعد");
  });

  test("an empty list explains itself and cannot be sent", async ({ page }) => {
    await openHome(page);
    await page.getByRole("button", { name: /فهرست استعلام، ۰ فرش/ }).click();
    const drawer = page.getByRole("dialog", { name: "فهرست انتخاب شما" });
    await expect(drawer).toContainText("فهرست شما خالی است");
    await expect(drawer.getByRole("button", { name: "ثبت درخواست استعلام" })).toBeDisabled();
  });
});

test.describe("newsletter", () => {
  test("subscribes a valid email", async ({ page }) => {
    await openHome(page);
    let email: string | null = null;
    await page.route("**/api/newsletter/subscriptions", async (route) => {
      email = (route.request().postDataJSON() as { email: string }).email;
      await route.fulfill({ status: 204 });
    });
    const footer = page.locator("footer");
    await footer.getByLabel("ایمیل").fill("  Hadi@Example.com ");
    await footer.getByRole("button", { name: "عضویت" }).click();
    await expect(footer.getByRole("status")).toContainText("عضو شدید");
    expect(email).toBe("hadi@example.com");
  });

  test("rejects an invalid email without calling the API", async ({ page }) => {
    await openHome(page);
    let called = false;
    await page.route("**/api/newsletter/subscriptions", (route) => {
      called = true;
      return route.fulfill({ status: 204 });
    });
    const footer = page.locator("footer");
    await footer.getByLabel("ایمیل").fill("not-an-email");
    await footer.getByRole("button", { name: "عضویت" }).click();
    await expect(footer.getByRole("alert")).toBeVisible();
    expect(called).toBe(false);
  });
});
