import { COOKIE_NAMES } from "@farsh/contracts";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { TestApp } from "./test-app.js";
import { cookiesOf, cookieValue, createTestApp, OTP_CODE, signIn } from "./test-app.js";

let t: TestApp;

beforeAll(async () => {
  t = await createTestApp();
});

afterAll(async () => {
  await t.close();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("OTP", () => {
  it("answers 204 for a known and an unknown mobile alike", async () => {
    await signIn(t, "09120000001");
    await request(t.http).post("/v1/auth/otp/request").send({ mobile: "09120000001" }).expect(204);
    await request(t.http).post("/v1/auth/otp/request").send({ mobile: "09120000002" }).expect(204);
  });

  it("enforces a per-mobile cooldown", async () => {
    await request(t.http).post("/v1/auth/otp/request").send({ mobile: "09120000003" }).expect(204);
    const res = await request(t.http)
      .post("/v1/auth/otp/request")
      .send({ mobile: "09120000003" })
      .expect(429);
    expect(res.body).toMatchObject({ code: "RATE_LIMITED", statusCode: 429 });
  });

  it("rejects an invalid mobile with Persian field errors", async () => {
    const res = await request(t.http)
      .post("/v1/auth/otp/request")
      .send({ mobile: "12345" })
      .expect(400);
    expect(res.body).toMatchObject({
      code: "VALIDATION_FAILED",
      details: [{ path: "mobile", message: "شماره موبایل معتبر نیست" }],
    });
  });

  it("rejects a wrong code and then a code after too many attempts", async () => {
    const mobile = "09120000004";
    await request(t.http).post("/v1/auth/otp/request").send({ mobile }).expect(204);
    const wrong = await request(t.http)
      .post("/v1/auth/otp/verify")
      .send({ mobile, code: "000000" })
      .expect(400);
    expect(wrong.body).toMatchObject({ code: "OTP_INVALID", message: "کد تأیید نادرست است" });

    for (let i = 0; i < 4; i += 1) {
      await request(t.http).post("/v1/auth/otp/verify").send({ mobile, code: "000000" });
    }
    const locked = await request(t.http)
      .post("/v1/auth/otp/verify")
      .send({ mobile, code: OTP_CODE })
      .expect(400);
    expect(locked.body).toMatchObject({ code: "OTP_EXPIRED" });
  });

  it("signs in with Persian digits, sets httpOnly cookies and creates the user", async () => {
    await request(t.http).post("/v1/auth/otp/request").send({ mobile: "۰۹۱۲۰۰۰۰۰۰۵" }).expect(204);
    const res = await request(t.http)
      .post("/v1/auth/otp/verify")
      .send({ mobile: "09120000005", code: "۱۲۳۴۵۶" })
      .expect(200);

    expect(res.body.data.user).toMatchObject({ mobile: "09120000005", role: "user" });
    const cookies = cookiesOf(res);
    for (const name of [COOKIE_NAMES.access, COOKIE_NAMES.refresh]) {
      expect(cookies[name]).toMatch(/HttpOnly/);
      expect(cookies[name]).toMatch(/SameSite=Lax/);
      expect(cookies[name]).toMatch(/Path=\//);
    }
    // The code is single-use
    await request(t.http)
      .post("/v1/auth/otp/verify")
      .send({ mobile: "09120000005", code: OTP_CODE })
      .expect(400);
  });
});

describe("session", () => {
  it("returns 401 without a cookie, and the user with a cookie or a Bearer token", async () => {
    const unauth = await request(t.http).get("/v1/auth/me").expect(401);
    expect(unauth.body).toMatchObject({
      code: "UNAUTHENTICATED",
      message: "لطفاً وارد حساب خود شوید",
    });

    const session = await signIn(t, "09120000010");
    const viaCookie = await request(t.http)
      .get("/v1/auth/me")
      .set("Cookie", session.cookie)
      .expect(200);
    expect(viaCookie.body).toEqual({ data: { user: session.user } });

    await request(t.http)
      .get("/v1/auth/me")
      .set("Authorization", `Bearer ${session.accessToken}`)
      .expect(200);
    await request(t.http).get("/v1/auth/me").set("Authorization", "Bearer forged").expect(401);
  });

  it("rotates the refresh token and tolerates a parallel reuse within the grace window", async () => {
    const session = await signIn(t, "09120000011");
    const first = await request(t.http)
      .post("/v1/auth/refresh")
      .set("Cookie", session.cookie)
      .expect(204);
    const rotated = cookieValue(first, COOKIE_NAMES.refresh);
    expect(rotated).toBeTruthy();
    expect(rotated).not.toBe(session.refreshToken);
    expect(cookieValue(first, COOKIE_NAMES.access)).toBeTruthy();

    // Another tab presents the old token a moment later
    await request(t.http).post("/v1/auth/refresh").set("Cookie", session.cookie).expect(204);
  });

  it("revokes the whole family when a rotated token is reused after the grace window", async () => {
    const session = await signIn(t, "09120000012");
    const first = await request(t.http)
      .post("/v1/auth/refresh")
      .set("Cookie", session.cookie)
      .expect(204);
    const rotated = cookieValue(first, COOKIE_NAMES.refresh) ?? "";

    vi.useFakeTimers({ toFake: ["Date"], now: Date.now() + 11_000 });
    const reuse = await request(t.http)
      .post("/v1/auth/refresh")
      .set("Cookie", session.cookie)
      .expect(401);
    expect(reuse.body).toMatchObject({ code: "UNAUTHENTICATED" });
    expect(cookiesOf(reuse)[COOKIE_NAMES.refresh]).toMatch(/Expires=Thu, 01 Jan 1970/);

    // The legitimate holder of the newest token is signed out too
    await request(t.http)
      .post("/v1/auth/refresh")
      .set("Cookie", `${COOKIE_NAMES.refresh}=${rotated}`)
      .expect(401);
  });

  it("ends a session 90 days after sign-in however often it was refreshed", async () => {
    const session = await signIn(t, "09120000013");
    const day = 24 * 60 * 60 * 1000;
    const signedInAt = Date.now();

    // Refreshing every 29 days keeps the 30-day window alive, but not past the 90-day cap
    let cookie = session.cookie;
    for (const days of [29, 58, 87]) {
      vi.useFakeTimers({ toFake: ["Date"], now: signedInAt + days * day });
      const res = await request(t.http).post("/v1/auth/refresh").set("Cookie", cookie).expect(204);
      cookie = [`${COOKIE_NAMES.refresh}=${cookieValue(res, COOKIE_NAMES.refresh) ?? ""}`];
    }
    const last = await t.connection
      .collection("refreshtokens")
      .findOne({}, { sort: { createdAt: -1 } });
    expect(last?.expiresAt.getTime()).toBeLessThanOrEqual(signedInAt + 90 * day + 1000);

    vi.useFakeTimers({ toFake: ["Date"], now: signedInAt + 91 * day });
    await request(t.http).post("/v1/auth/refresh").set("Cookie", cookie).expect(401);
  });

  it("logs out by revoking the family and clearing cookies", async () => {
    const session = await signIn(t, "09120000013");
    const res = await request(t.http)
      .post("/v1/auth/logout")
      .set("Cookie", session.cookie)
      .expect(204);
    expect(cookiesOf(res)[COOKIE_NAMES.access]).toMatch(/Expires=Thu, 01 Jan 1970/);
    await request(t.http).post("/v1/auth/refresh").set("Cookie", session.cookie).expect(401);
  });
});

describe("users/me", () => {
  it("updates the profile and ignores an injected role", async () => {
    const session = await signIn(t, "09120000020");
    const res = await request(t.http)
      .patch("/v1/users/me")
      .set("Cookie", session.cookie)
      .send({ firstName: " هادی ", role: "admin" })
      .expect(200);
    expect(res.body.data).toMatchObject({ firstName: "هادی", role: "user" });
  });

  it("refuses to delete the account without a fresh code", async () => {
    const session = await signIn(t, "09120000022");
    await request(t.http).delete("/v1/users/me").set("Cookie", session.cookie).expect(400);
    // The sign-in code was used up, so replaying it fails until a new one is requested
    const replay = await request(t.http)
      .delete("/v1/users/me")
      .set("Cookie", session.cookie)
      .send({ code: OTP_CODE })
      .expect(400);
    expect(replay.body).toMatchObject({ code: "OTP_EXPIRED" });
    await request(t.http).get("/v1/auth/me").set("Cookie", session.cookie).expect(200);
  });

  it("soft-deletes the account, and the same mobile can register again", async () => {
    const session = await signIn(t, "09120000021");
    await request(t.http).post("/v1/auth/otp/request").send({ mobile: "09120000021" }).expect(204);
    await request(t.http)
      .delete("/v1/users/me")
      .set("Cookie", session.cookie)
      .send({ code: OTP_CODE })
      .expect(204);
    await request(t.http).get("/v1/auth/me").set("Cookie", session.cookie).expect(401);
    await request(t.http).post("/v1/auth/refresh").set("Cookie", session.cookie).expect(401);

    const again = await signIn(t, "09120000021");
    expect(again.user.id).not.toBe(session.user.id);
    expect(await t.connection.collection("users").countDocuments({ mobile: "09120000021" })).toBe(
      2,
    );
  });
});
