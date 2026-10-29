import AxeBuilder from "@axe-core/playwright";
import type { BrowserContext, Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { E2E_CARPETS } from "./mock-api";

const signIn = (context: BrowserContext, value: string) =>
  context.addCookies([
    { name: "access_token", value, url: "http://localhost:7782", httpOnly: true },
  ]);

const photo = { image: "/carpets/three-medallion.jpg", imageAspect: 0.6667 };

/** Browser calls go through /api, which page.route answers; each test reads what was sent. */
async function mockWrites(page: Page) {
  const sent: { method: string; url: string; body: unknown }[] = [];
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url()).pathname;
    const body =
      request.method() === "POST" && url.endsWith("/media/carpets")
        ? "photo"
        : request.postDataJSON();
    sent.push({ method: request.method(), url, body });
    if (url === "/api/media/carpets") return route.fulfill({ status: 201, json: { data: photo } });
    if (request.method() === "DELETE") return route.fulfill({ status: 204 });
    return route.fulfill({ status: request.method() === "POST" ? 201 : 200, json: { data: {} } });
  });
  return sent;
}

test.describe("catalogue admin", () => {
  test("is only for admins", async ({ page, context }) => {
    await page.goto("/dashboard/catalogue");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard%2Fcatalogue$/);
    await signIn(context, "e2e-valid");
    await page.goto("/dashboard/catalogue");
    await expect(page).toHaveURL(/\/$/);
  });

  test("lists the carpets and edits one", async ({ page, context, consoleProblems }) => {
    await signIn(context, "e2e-admin");
    const sent = await mockWrites(page);
    await page.goto("/dashboard/profile");
    await page.getByRole("link", { name: /فرش‌های ویترین/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("فرش‌های ویترین");
    await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(E2E_CARPETS.length);
    await expect(page.getByText("عکس موقت")).toBeVisible();

    await page.getByRole("link", { name: /کاشان سرخ/ }).click();
    await expect(page).toHaveURL(/\/dashboard\/catalogue\/edit\/kashan-red$/);
    await expect(page.getByLabel("قیمت (تومان)")).toHaveValue("45000000");
    await expect(page.getByLabel("شناسه در نشانی صفحه")).toBeDisabled();

    await page.getByLabel("قیمت (تومان)").fill("۵۰٬۰۰۰٬۰۰۰");
    await page.getByLabel("محل بافت").fill("");
    await page.getByRole("button", { name: "ذخیره‌ی تغییرات" }).click();
    await expect(page.getByText("تغییرات ذخیره شد")).toBeVisible();
    expect(sent).toEqual([
      {
        method: "PATCH",
        url: "/api/carpets/kashan-red",
        body: {
          name: "کاشان سرخ",
          material: "wool",
          widthCm: 200,
          lengthCm: 300,
          density: { unit: "raj", value: 50 },
          priceRial: 500_000_000,
          provenance: null,
          isPlaceholder: false,
          image: "/carpets/kashan-red.jpg",
          imageAspect: 0.6667,
        },
      },
    ]);
    expect(consoleProblems).toEqual([]);
  });

  test("adds a carpet with its photo", async ({ page, context }) => {
    await signIn(context, "e2e-admin");
    const sent = await mockWrites(page);
    await page.goto("/dashboard/catalogue/new");

    await page.getByRole("button", { name: "افزودن فرش" }).click();
    await expect(page.getByText("عکس فرش را بارگذاری کنید")).toBeVisible();
    await expect(page.getByText("نام فرش را بنویسید")).toBeVisible();
    expect(sent).toEqual([]);

    await page
      .getByLabel("عکس فرش", { exact: true })
      .setInputFiles("public/carpets/three-medallion.jpg");
    await expect(page.getByRole("img", { name: "عکس فعلی فرش" })).toBeVisible();
    await page.getByLabel("نام فرش").fill("سه ترنج");
    await page.getByLabel("شناسه در نشانی صفحه").fill("three-medallion-2");
    await page.getByLabel("جنس پرز").selectOption("silk");
    await page.getByLabel("عرض (سانتی‌متر)").fill("۱۵۰");
    await page.getByLabel("طول (سانتی‌متر)").fill("225");
    await page.getByLabel("واحد").selectOption("shaneh");
    await page.getByLabel("شانه").fill("1200");
    await page.getByRole("button", { name: "افزودن فرش" }).click();

    await expect(page).toHaveURL(/\/dashboard\/catalogue\/edit\/three-medallion-2$/);
    expect(sent.map(({ method, url }) => `${method} ${url}`)).toEqual([
      "POST /api/media/carpets",
      "POST /api/carpets",
    ]);
    expect(sent[1]?.body).toEqual({
      slug: "three-medallion-2",
      name: "سه ترنج",
      material: "silk",
      widthCm: 150,
      lengthCm: 225,
      density: { unit: "shaneh", value: 1200 },
      isPlaceholder: false,
      ...photo,
    });
  });

  test("puts a taken slug's error on the slug field", async ({ page, context }) => {
    await signIn(context, "e2e-admin");
    await page.route("**/api/**", (route) =>
      new URL(route.request().url()).pathname === "/api/media/carpets"
        ? route.fulfill({ status: 201, json: { data: photo } })
        : route.fulfill({
            status: 409,
            json: {
              statusCode: 409,
              code: "CONFLICT",
              message: "فرشی با این شناسه از قبل وجود دارد",
            },
          }),
    );
    await page.goto("/dashboard/catalogue/new");
    await page
      .getByLabel("عکس فرش", { exact: true })
      .setInputFiles("public/carpets/three-medallion.jpg");
    await page.getByLabel("نام فرش").fill("کاشان");
    await page.getByLabel("شناسه در نشانی صفحه").fill("kashan-red");
    await page.getByLabel("عرض (سانتی‌متر)").fill("200");
    await page.getByLabel("طول (سانتی‌متر)").fill("300");
    await page.getByRole("button", { name: "افزودن فرش" }).click();
    await expect(page.getByLabel("شناسه در نشانی صفحه")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("فرشی با این شناسه از قبل وجود دارد")).toBeVisible();
  });

  test("removes a carpet after confirmation", async ({ page, context }) => {
    await signIn(context, "e2e-admin");
    const sent = await mockWrites(page);
    await page.goto("/dashboard/catalogue/edit/navy-medallion");
    await page.getByRole("button", { name: "برداشتن این فرش" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "برداشتن" }).click();
    await expect(page).toHaveURL(/\/dashboard\/catalogue$/);
    expect(sent).toEqual([{ method: "DELETE", url: "/api/carpets/navy-medallion", body: null }]);
  });

  test("shows not-found for an unknown carpet", async ({ page, context }) => {
    await signIn(context, "e2e-admin");
    await page.goto("/dashboard/catalogue/edit/nope");
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("این صفحه پیدا نشد");
  });

  test("has no WCAG A/AA violations", async ({ page, context }) => {
    await signIn(context, "e2e-admin");
    for (const path of ["/dashboard/catalogue", "/dashboard/catalogue/edit/kashan-red"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(results.violations).toEqual([]);
    }
  });
});
