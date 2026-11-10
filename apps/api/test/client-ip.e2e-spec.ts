import request from "supertest";
import { afterAll, beforeAll, describe, it } from "vitest";

import { CLIENT_IP_HEADER, PROXY_SECRET_HEADER } from "../src/common/http/client-ip.js";
import type { TestApp } from "./test-app.js";
import { createTestApp } from "./test-app.js";

const SECRET = "e2e-proxy-secret-that-is-long-enough-12345";
let t: TestApp;

beforeAll(async () => {
  // Its own file: THROTTLE_ENABLED and API_PROXY_SECRET are read once, when the app module is imported
  t = await createTestApp({ THROTTLE_ENABLED: "true", API_PROXY_SECRET: SECRET });
});

afterAll(async () => {
  await t.close();
});

function otp(mobile: string, headers: Record<string, string>) {
  return request(t.http).post("/v1/auth/otp/request").set(headers).send({ mobile });
}

describe("rate limits behind the web app's proxy", () => {
  it("counts each visitor the web app vouches for separately", async () => {
    const first = { [CLIENT_IP_HEADER]: "5.160.0.1", [PROXY_SECRET_HEADER]: SECRET };
    const second = { [CLIENT_IP_HEADER]: "5.160.0.2", [PROXY_SECRET_HEADER]: SECRET };
    for (const mobile of ["09120000201", "09120000202", "09120000203"]) {
      await otp(mobile, first).expect(204);
    }
    await otp("09120000204", first).expect(429);
    // Same socket address, a different visitor: not throttled by the first one's requests
    await otp("09120000205", second).expect(204);
  });

  it("does not let a caller without the secret pick its own address", async () => {
    for (const [i, mobile] of ["09120000301", "09120000302", "09120000303"].entries()) {
      await otp(mobile, { [CLIENT_IP_HEADER]: `9.9.9.${i}` }).expect(204);
    }
    await otp("09120000304", { [CLIENT_IP_HEADER]: "9.9.9.9" }).expect(429);
  });
});
