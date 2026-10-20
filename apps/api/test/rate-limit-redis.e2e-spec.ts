import { randomUUID } from "node:crypto";

import { Redis } from "ioredis";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { TestApp } from "./test-app.js";
import { createTestApp } from "./test-app.js";

// CI starts a Redis service; locally: docker run -p 127.0.0.1:6379:6379 redis:8-alpine
const redisUrl = process.env.REDIS_TEST_URL;
const prefix = `farsh:throttle`;

describe.skipIf(!redisUrl)("rate limits shared through Redis", () => {
  let first: TestApp;
  let second: TestApp;
  let redis: Redis;

  beforeAll(async () => {
    redis = new Redis(redisUrl ?? "");
    await redis.flushdb();
    const env = { THROTTLE_ENABLED: "true", REDIS_URL: redisUrl ?? "" };
    // Two API instances, as PM2 cluster mode would run them, sharing one Redis
    first = await createTestApp(env);
    second = await createTestApp(env);
  });

  afterAll(async () => {
    // Both share the database chosen when the app module was first imported; drop it once
    await second.app.close();
    await first.close();
    await redis.quit();
  });

  it("counts OTP requests from both processes against one limit", async () => {
    const mobile = () => `0912${Math.floor(1_000_000 + Math.random() * 8_999_999)}`;
    await request(first.http).post("/v1/auth/otp/request").send({ mobile: mobile() }).expect(204);
    await request(second.http).post("/v1/auth/otp/request").send({ mobile: mobile() }).expect(204);
    await request(first.http).post("/v1/auth/otp/request").send({ mobile: mobile() }).expect(204);
    const limited = await request(second.http)
      .post("/v1/auth/otp/request")
      .send({ mobile: mobile() })
      .expect(429);
    expect(limited.body).toMatchObject({ code: "RATE_LIMITED" });
    expect(limited.headers["retry-after"]).toBeDefined();

    const keys = await redis.keys(`${prefix}:*`);
    expect(keys.length).toBeGreaterThan(0);
    expect(await redis.pttl(keys[0] ?? randomUUID())).toBeGreaterThan(0);
  });
});
