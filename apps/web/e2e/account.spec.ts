import type { BrowserContext } from "@playwright/test";

import { expect, test } from "./fixtures";
import { E2E_USER as user } from "./mock-api";

const signedIn = { name: "access_token", value: "e2e-valid" };

async function setCookies(context: BrowserContext, cookies: { name: string; value: string }[]) {
  await context.addCookies(
    cookies.map((cookie) => ({ ...cookie, url: "http://localhost:7782", httpOnly: true })),
  );
}

test.describe("account", () => {
  test("signs in with a code sent to the mobile", async ({ page, consoleProblems }) => {
    let requested: unknown = null;
    await page.route("**/api/auth/otp/request", async (route) => {
      requested = route.request().postDataJSON();
      await route.fulfill({ status: 204 });
    });
    await page.route("**/api/auth/otp/verify", (route) =>
      route.fulfill({
        status: 200,
        json: { data: { user } },
        headers: { "set-cookie": "access_token=e2e-valid; Path=/; HttpOnly; SameSite=Lax" },
      }),
    );

    await page.goto("/sign-in?next=/dashboard/profile");
    const mobile = page.getByLabel("شماره موبایل");
    await expect(async () => {
      await mobile.fill("۰۹۱۲۳۴۵۶۷۸۹");
      await expect(mobile).toHaveValue("۰۹۱۲۳۴۵۶۷۸۹");
    }).toPass();
    await page.getByRole("button", { name: "دریافت کد تأیید" }).click();
    const code = page.getByLabel("کد تأیید");
    await expect(code).toBeVisible();
    expect(requested).toEqual({ mobile: "09123456789" });

    await page.getByRole("button", { name: "ورود" }).click();
    await expect(code).toHaveAttribute("aria-invalid", "true");
    // Six Persian digits are normalised and submit on their own
    await code.fill("۱۲۳۴۵۶");
    await expect(page).toHaveURL(/\/dashboard\/profile$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("سلام هادی");
    await expect(page.getByRole("button", { name: "خروج از حساب" })).toBeVisible();
    expect(consoleProblems).toEqual([]);
  });

  test("sends a visitor without a session to sign-in and back", async ({ page }) => {
    await page.goto("/dashboard/profile");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard%2Fprofile$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ورود به حساب");
  });

  test("keeps old /account links working", async ({ page, context }) => {
    await setCookies(context, [signedIn]);
    await page.goto("/account");
    await expect(page).toHaveURL(/\/dashboard\/profile$/);
  });

  test("renews an expired access cookie before rendering", async ({ page, context }) => {
    await setCookies(context, [{ name: "refresh_token", value: "e2e-refresh" }]);
    await page.goto("/dashboard/profile");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("سلام هادی");
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "access_token")?.value).toBe("e2e-valid");
    expect(cookies.find((c) => c.name === "refresh_token")?.value).toBe("e2e-refresh-2");
  });

  test("skips sign-in for someone already signed in", async ({ page, context }) => {
    await setCookies(context, [signedIn]);
    await page.goto("/sign-in?next=https://evil.example");
    await expect(page).toHaveURL(/\/dashboard\/profile$/);
  });

  test("confirms, then asks for a fresh code before deleting the account", async ({
    page,
    context,
  }) => {
    await setCookies(context, [signedIn]);
    await page.route("**/api/auth/otp/request", (route) => route.fulfill({ status: 204 }));
    let deleted: unknown = null;
    await page.route("**/api/users/me", async (route) => {
      deleted = route.request().postDataJSON();
      await route.fulfill({ status: 204 });
    });

    await page.goto("/dashboard/profile");
    await page.getByRole("button", { name: "حذف حساب" }).click();
    const dialog = page.getByRole("alertdialog", { name: "حساب حذف شود؟" });
    await dialog.getByRole("button", { name: "انصراف" }).click();
    await expect(dialog).toBeHidden();
    expect(deleted).toBeNull();

    await page.getByRole("button", { name: "حذف حساب" }).click();
    await dialog.getByRole("button", { name: "ارسال کد حذف" }).click();
    await page.getByLabel("کد تأیید").fill("654321");
    await expect(page).toHaveURL(/\/$/);
    expect(deleted).toEqual({ code: "654321" });
  });

  test("sends a Content-Security-Policy with a fresh nonce", async ({ page }) => {
    const first = await page.goto("/sign-in");
    const second = await page.goto("/sign-in");
    const csp = (await first?.allHeaders())?.["content-security-policy"] ?? "";
    expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(csp).not.toContain("unsafe-eval");
    expect((await second?.allHeaders())?.["content-security-policy"]).not.toBe(csp);
  });
});
