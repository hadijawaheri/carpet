import { NestFactory } from "@nestjs/core";
import { getConnectionToken } from "@nestjs/mongoose";
import type { Connection } from "mongoose";

import { AppModule } from "../app.module.js";
import { migrations } from "../database/migrations/index.js";
import { runMigrations } from "../database/migrator.js";

const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn"] });
try {
  const ran = await runMigrations(app.get<Connection>(getConnectionToken()), migrations);
  process.stdout.write(
    ran.length === 0 ? "Migrations: nothing to apply\n" : `Migrations applied: ${ran.join(", ")}\n`,
  );
} finally {
  await app.close();
}
