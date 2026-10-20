import { VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { Logger } from "nestjs-pino";

import { originCheck } from "./common/middleware/origin-check.js";
import type { Env } from "./config/env.js";

// Shared by main.ts and e2e tests so tests exercise the real HTTP setup
export function configureApp(app: NestExpressApplication): void {
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.useLogger(app.get(Logger));
  // Caddy is the only hop in front of us (Next forwards X-Forwarded-For untouched)
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cookieParser());
  app.useBodyParser("json", { limit: "100kb" });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  const origins = config.get("CORS_ORIGINS", { infer: true });
  app.enableCors({ origin: origins, credentials: true });
  app.use(originCheck(origins));
  app.enableShutdownHooks();
}
