import type { OnApplicationShutdown } from "@nestjs/common";
import { Global, Inject, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";

import type { Env } from "../../config/env.js";

/** The shared client, or null when REDIS_URL is unset and the API runs as a single process. */
export const REDIS = Symbol("REDIS");

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): Redis | null => {
        const url = config.get("REDIS_URL", { infer: true });
        // Fail fast instead of queueing commands forever while Redis is down
        return url ? new Redis(url, { maxRetriesPerRequest: 2, enableOfflineQueue: false }) : null;
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: Redis | null) {}

  async onApplicationShutdown(): Promise<void> {
    await this.redis?.quit();
  }
}
