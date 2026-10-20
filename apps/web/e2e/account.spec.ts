import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const user = {
  id: "6650f0c2a1b2c3d4e5f60718",
  mobile: "09123456789",
  firstName: "هادی",
  lastName: null,
  role: "user",
  createdAt: new Date().toISOString(),
};

const unauthenticated = {
  status: 401,
  json: { statusCode: 401, code: "UNAUTHENTICATED", message: "لطفاً وارد حساب خود شوید" },
};

async function mockSignedOut(page: Page) {
  await page.route("**/api/auth/me", (route) => route.fulfill(unauthenticated));
  await page.route("**/api/auth/refresh", (route) => route.fulfill(unauthenticated));
}

test.describe("account", () => {
  test("signs in with a code sent to the mobile", async ({ page, consoleProblems }) => {
    await mockSignedOut(page);
    let requested: unknown = null;
    await page.route("**/api/auth/otp/request", async (route) => {
      requested = route.request().postDataJSON();
      await route.fulfill({ status: 204 });
    });
    await page.route("**/api/auth/otp/verify", (route) =>
      route.fulfill({ status: 200, json: { data: { user } } }),
    );

    await page.goto("/account");
    await page.getByLabel("شماره موبایل").fill("۰۹۱۲۳۴۵۶۷۸۹");
    await page.getByRole("button", { name: "دریافت کد تأیید" }).click();
    await expect(page.getByLabel("کد تأیید")).toBeVisible();
    expect(requested).toEqual({ mobile: "09123456789" });

    await page.getByRole("button", { name: "ورود" }).click();
    await expect(page.getByLabel("کد تأیید")).toHaveAttribute("aria-invalid", "true");
    await page.getByLabel("کد تأیید").fill("۱۲۳۴۵۶");
    await page.getByRole("button", { name: "ورود" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("سلام هادی");
    await expect(page.getByRole("button", { name: "خروج از حساب" })).toBeVisible();
    // 401s from the signed-out probe are expected network errors, not page defects
    expect(consoleProblems.filter((p) => !/401/.test(p))).toEqual([]);
  });

  test("renews an expired access cookie once before giving up", async ({ page }) => {
    let meCalls = 0;
    await page.route("**/api/auth/me", (route) => {
      meCalls += 1;
      return meCalls === 1
        ? route.fulfill(unauthenticated)
        : route.fulfill({ status: 200, json: { data: { user } } });
    });
    await page.route("**/api/auth/refresh", (route) => route.fulfill({ status: 204 }));

    await page.goto("/account");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("سلام هادی");
    expect(meCalls).toBe(2);
  });

  test("asks for a fresh code before deleting the account", async ({ page }) => {
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({ status: 200, json: { data: { user } } }),
    );
    await page.route("**/api/auth/otp/request", (route) => route.fulfill({ status: 204 }));
    let deleted: unknown = null;
    await page.route("**/api/users/me", async (route) => {
      deleted = route.request().postDataJSON();
      await route.fulfill({ status: 204 });
    });

    await page.goto("/account");
    await page.getByRole("button", { name: "ارسال کد برای حذف حساب" }).click();
    await page.getByLabel("کد تأیید").fill("654321");
    await page.getByRole("button", { name: "حذف همیشگی حساب" }).click();
    await expect(page.getByRole("button", { name: "دریافت کد تأیید" })).toBeVisible();
    expect(deleted).toEqual({ code: "654321" });
  });

  test("sends a Content-Security-Policy with a fresh nonce", async ({ page }) => {
    await mockSignedOut(page);
    const first = await page.goto("/account");
    const second = await page.goto("/account");
    const csp = (await first?.allHeaders())?.["content-security-policy"] ?? "";
    expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(csp).not.toContain("unsafe-eval");
    expect((await second?.allHeaders())?.["content-security-policy"]).not.toBe(csp);
  });
});
