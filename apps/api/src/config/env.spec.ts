import { describe, expect, it } from "vitest";

import { validateEnv } from "./env.js";

const base = {
  DATABASE_URL: "mongodb://127.0.0.1:27018/farsh?replicaSet=rs0",
  JWT_ACCESS_SECRET: "a".repeat(32),
  OTP_HMAC_SECRET: "b".repeat(32),
};

describe("validateEnv", () => {
  it("applies defaults and treats an empty OTP_FIXED_CODE as unset", () => {
    const env = validateEnv({ ...base, OTP_FIXED_CODE: "" });
    expect(env.PORT).toBe(7781);
    expect(env.OTP_FIXED_CODE).toBeUndefined();
    expect(env.CORS_ORIGINS).toEqual(["http://localhost:7782"]);
  });

  it("refuses to start without secrets", () => {
    expect(() => validateEnv({ DATABASE_URL: base.DATABASE_URL })).toThrow();
  });

  it("forbids the fixed OTP and console SMS in production", () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: "production",
        SMS_PROVIDER: "melipayamak",
        OTP_FIXED_CODE: "123456",
      }),
    ).toThrow();
    expect(() => validateEnv({ ...base, NODE_ENV: "production" })).toThrow();
  });

  it("needs a key and pattern id for Melipayamak", () => {
    expect(() => validateEnv({ ...base, SMS_PROVIDER: "melipayamak" })).toThrow(/MELIPAYAMAK/);
    const env = validateEnv({
      ...base,
      NODE_ENV: "production",
      SMS_PROVIDER: "melipayamak",
      MELIPAYAMAK_API_KEY: "key-12345678",
      MELIPAYAMAK_BODY_ID: "42",
    });
    expect(env.MELIPAYAMAK_BODY_ID).toBe(42);
  });
});
