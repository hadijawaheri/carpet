import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts", "test/**/*.e2e-spec.ts"],
    globalSetup: ["test/global-setup.ts"],
    // The first run may download a mongod binary
    hookTimeout: 120_000,
    testTimeout: 30_000,
  },
});
