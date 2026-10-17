import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { TestApp } from "./test-app.js";
import { createTestApp } from "./test-app.js";

let t: TestApp;

beforeAll(async () => {
  t = await createTestApp();
});

afterAll(async () => {
  await t.close();
});

describe("newsletter", () => {
  it("subscribes idempotently and normalises the address", async () => {
    await request(t.http)
      .post("/v1/newsletter/subscriptions")
      .send({ email: "Hadi@Example.com" })
      .expect(204);
    await request(t.http)
      .post("/v1/newsletter/subscriptions")
      .send({ email: " hadi@example.com " })
      .expect(204);
    const docs = await t.connection.collection("newsletter_subscriptions").find().toArray();
    expect(docs.map((d) => d.email)).toEqual(["hadi@example.com"]);
  });

  it("rejects a malformed address", async () => {
    const res = await request(t.http)
      .post("/v1/newsletter/subscriptions")
      .send({ email: "nope" })
      .expect(400);
    expect(res.body).toMatchObject({ code: "VALIDATION_FAILED" });
  });
});

describe("health and plumbing", () => {
  it("reports liveness and readiness without a session or version prefix", async () => {
    await request(t.http).get("/health/live").expect(200);
    const ready = await request(t.http).get("/health/ready").expect(200);
    expect(ready.body).toMatchObject({ status: "ok", info: { mongo: { status: "up" } } });
  });

  it("echoes a request id and answers unknown routes in Persian", async () => {
    const res = await request(t.http).get("/v1/nope").set("x-request-id", "abc-123").expect(404);
    expect(res.headers["x-request-id"]).toBe("abc-123");
    expect(res.body).toEqual({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "مورد درخواستی یافت نشد",
      requestId: "abc-123",
    });
  });

  it("answers malformed JSON with a Persian 400", async () => {
    const res = await request(t.http)
      .post("/v1/newsletter/subscriptions")
      .set("Content-Type", "application/json")
      .send("{bad")
      .expect(400);
    expect(res.body).toMatchObject({ code: "VALIDATION_FAILED" });
    expect(res.body.message).toMatch(/[؀-ۿ]/);
  });
});
