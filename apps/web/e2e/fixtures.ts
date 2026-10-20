import { expect, type Page, test as base } from "@playwright/test";

/** Console noise that is not a defect of this site. */
const ignoredConsole = [
  /THREE\.Clock: This module has been deprecated/,
  /Largest Contentful Paint/,
  /GPU stall due to ReadPixels/,
  /GL Driver Message/,
  /Automatic fallback to software WebGL/,
  /WebGL.*performance/i,
];

interface Fixtures {
  /** Errors and warnings the page logged; each test asserts it stays empty. */
  consoleProblems: string[];
}

export const test = base.extend<Fixtures>({
  consoleProblems: async ({ page }, provide) => {
    const problems: string[] = [];
    page.on("console", (message) => {
      if (message.type() !== "error" && message.type() !== "warning") return;
      const text = message.text();
      if (!ignoredConsole.some((pattern) => pattern.test(text))) problems.push(text);
    });
    page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
    await provide(problems);
  },
});

export { expect };

/** Opens the home page with the API mocked: the Nest API is not running during these tests. */
export async function openHome(page: Page) {
  await page.route("**/api/**", (route) =>
    route.fulfill({
      status: 503,
      json: { statusCode: 503, code: "INTERNAL", message: "سرویس در دسترس نیست" },
    }),
  );
  await page.goto("/");
  // Smooth scrolling makes scripted jumps between sections race the assertions.
  await page.evaluate(() => document.documentElement.classList.remove("scroll-smooth"));
}
