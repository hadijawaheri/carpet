import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { TestApp } from "./test-app.js";
import { createTestApp } from "./test-app.js";

let t: TestApp;

beforeAll(async () => {
  t = await createTestApp({ CORS_ORIGINS: "https://farsh.example" });
});

afterAll(async () => {
  await t.close();
});

const subscribe = () => request(t.http).post("/v1/newsletter/subscriptions");

describe("origin check", () => {
  it("accepts a write from our own origin", async () => {
    await subscribe()
      .set("Origin", "https://farsh.example")
      .send({ email: "a@example.com" })
      .expect(204);
  });

  it("rejects a write from another origin, even a subdomain", async () => {
    const res = await subscribe()
      .set("Origin", "https://evil.farsh.example")
      .send({ email: "b@example.com" })
      .expect(403);
    expect(res.body).toMatchObject({ code: "FORBIDDEN" });
  });

  it("falls back to the Referer when Origin is missing", async () => {
    await subscribe()
      .set("Referer", "https://evil.example/page")
      .send({ email: "c@example.com" })
      .expect(403);
    await subscribe()
      .set("Referer", "https://farsh.example/#collection")
      .send({ email: "c@example.com" })
      .expect(204);
  });

  it("lets reads and non-browser clients through", async () => {
    await request(t.http).get("/v1/carpets").set("Origin", "https://evil.example").expect(200);
    await subscribe().send({ email: "d@example.com" }).expect(204);
  });
});
