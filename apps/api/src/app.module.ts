import { randomUUID } from "node:crypto";

import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_PIPE } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import type { Redis } from "ioredis";
import { LoggerModule } from "nestjs-pino";

import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard.js";
import { RolesGuard } from "./common/guards/roles.guard.js";
import { ZodValidationPipe } from "./common/zod/zod-validation.pipe.js";
import type { Env } from "./config/env.js";
import { validateEnv } from "./config/env.js";
import { HealthModule } from "./health/health.module.js";
import { REDIS, RedisModule } from "./infra/redis/redis.module.js";
import { RedisThrottlerStorage } from "./infra/redis/redis-throttler.storage.js";
import { SmsModule } from "./infra/sms/sms.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { CarpetsModule } from "./modules/carpets/carpets.module.js";
import { InquiriesModule } from "./modules/inquiries/inquiries.module.js";
import { NewsletterModule } from "./modules/newsletter/newsletter.module.js";
import { UsersModule } from "./modules/users/users.module.js";

const REQUEST_ID = /^[\w-]{1,64}$/;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const nodeEnv = config.get("NODE_ENV", { infer: true });
        return {
          pinoHttp: {
            level: nodeEnv === "test" ? "silent" : "info",
            genReqId: (req, res) => {
              const incoming = req.headers["x-request-id"];
              // A caller-chosen id is kept only if it is short and plain, so it cannot forge log lines
              const id =
                typeof incoming === "string" && REQUEST_ID.test(incoming) ? incoming : randomUUID();
              res.setHeader("x-request-id", id);
              return id;
            },
            autoLogging: { ignore: (req) => req.url?.startsWith("/health") ?? false },
            redact: [
              "req.headers.authorization",
              "req.headers.cookie",
              'res.headers["set-cookie"]',
            ],
            transport: nodeEnv === "development" ? { target: "pino-pretty" } : undefined,
          },
        };
      },
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        uri: config.get("DATABASE_URL", { infer: true }),
        // Production indexes are created by `pnpm db:indexes` on deploy, never at boot
        autoIndex: config.get("NODE_ENV", { infer: true }) !== "production",
      }),
    }),
    RedisModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService, REDIS],
      useFactory: (config: ConfigService<Env, true>, redis: Redis | null) => ({
        throttlers: [{ ttl: 60_000, limit: 100 }],
        skipIf: () => !config.get("THROTTLE_ENABLED", { infer: true }),
        ...(redis ? { storage: new RedisThrottlerStorage(redis) } : {}),
      }),
    }),
    JwtModule.register({ global: true }),
    SmsModule,
    HealthModule,
    UsersModule,
    AuthModule,
    CarpetsModule,
    InquiriesModule,
    NewsletterModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
