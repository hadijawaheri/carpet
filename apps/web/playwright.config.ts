import { defineConfig, devices } from "@playwright/test";

const port = 7782;
// Containers without a GPU still render WebGL through SwiftShader, so the 3D room is tested too.
const webgl = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"];
const launchOptions = {
  args: webgl,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${port}`,
    locale: "fa-IR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 }, launchOptions },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], launchOptions },
    },
  ],
  webServer: {
    // The production build, so tests see what visitors get; the API is mocked per test.
    command: `pnpm start --port ${port}`,
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
