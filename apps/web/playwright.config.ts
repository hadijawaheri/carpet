import { defineConfig, devices } from "@playwright/test";

const port = 7782;
const mockApiPort = 7799;
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
  // SwiftShader already spreads each frame over every core; parallel browsers starve each other.
  workers: process.env.CI ? 1 : undefined,
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
  webServer: [
    {
      command: "node e2e/mock-api.ts",
      port: mockApiPort,
      env: { MOCK_API_PORT: String(mockApiPort) },
      reuseExistingServer: !process.env.CI,
    },
    {
      // The standalone server PM2 runs in production (`next start` skips proxy.ts with standalone
      // output), so tests see what visitors get. Browser API calls are mocked per test.
      command: "pnpm start",
      port,
      env: { PORT: String(port), INTERNAL_API_URL: `http://127.0.0.1:${mockApiPort}` },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
