import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { TestApp } from "./test-app.js";
import { createTestApp } from "./test-app.js";

let t: TestApp;

beforeAll(async () => {
  // Its own file: THROTTLE_ENABLED is read once, when the app module is imported
  t = await createTestApp({ THROTTLE_ENABLED: "true" });
});

afterAll(async () => {
  await t.close();
});

describe("rate limits", () => {
  it("allows 5 inquiries a minute per IP, then answers 429 in Persian", async () => {
    const body = { name: "هادی", mobile: "09123456789", carpetSlugs: ["ghost"] };
    for (let i = 0; i < 5; i += 1) {
      const res = await request(t.http).post("/v1/inquiries").send(body);
      expect(res.status).toBe(400);
    }
    const limited = await request(t.http).post("/v1/inquiries").send(body).expect(429);
    expect(limited.body).toMatchObject({
      statusCode: 429,
      code: "RATE_LIMITED",
      message: "تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید",
    });
  });

  it("limits OTP requests per IP across different mobiles", async () => {
    for (const mobile of ["09120000101", "09120000102", "09120000103"]) {
      await request(t.http).post("/v1/auth/otp/request").send({ mobile }).expect(204);
    }
    await request(t.http).post("/v1/auth/otp/request").send({ mobile: "09120000104" }).expect(429);
  });

  it("never throttles health checks", async () => {
    for (let i = 0; i < 110; i += 1) await request(t.http).get("/health/live").expect(200);
  });
});
