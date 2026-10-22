// Read by the migrate-mongo CLI (`pnpm db:migrate`, `db:migrate:status`, `db:migrate:create`)
import { existsSync } from "node:fs";

// Same source as the API itself: apps/api/.env, or the environment when it is absent (CI, tests)
if (existsSync(".env")) process.loadEnvFile(".env");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

/** @type {import("migrate-mongo").config.Config} */
export default {
  mongodb: { url: process.env.DATABASE_URL },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  lockCollectionName: "changelog_lock",
  // A crashed run's lock expires instead of blocking every later deploy
  lockTtl: 300,
  migrationFileExtension: ".js",
  useFileHash: false,
  moduleSystem: "esm",
};
