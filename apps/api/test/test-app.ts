import { randomUUID } from "node:crypto";

import type { Role, UserDto } from "@farsh/contracts";
import { COOKIE_NAMES } from "@farsh/contracts";
import { getConnectionToken } from "@nestjs/mongoose";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import type { Connection } from "mongoose";
import request from "supertest";
import type { App } from "supertest/types.js";
import { inject } from "vitest";

export const OTP_CODE = "123456";

export interface TestApp {
  app: NestExpressApplication;
  http: App;
  connection: Connection;
  close: () => Promise<void>;
}

function databaseUrl(): string {
  const url = new URL(inject("mongoUri"));
  url.pathname = `/farsh-test-${randomUUID()}`;
  return url.toString();
}

export async function createTestApp(env: Record<string, string> = {}): Promise<TestApp> {
  Object.assign(process.env, {
    NODE_ENV: "test",
    DATABASE_URL: databaseUrl(),
    JWT_ACCESS_SECRET: "test-access-secret-that-is-long-enough-123",
    OTP_HMAC_SECRET: "test-otp-secret-that-is-long-enough-12345",
    SMS_PROVIDER: "console",
    OTP_FIXED_CODE: OTP_CODE,
    THROTTLE_ENABLED: "false",
    ...env,
  });
  // ConfigModule.forRoot validates when app.module is imported, so env must be set first
  const { AppModule } = await import("../src/app.module.js");
  const { configureApp } = await import("../src/configure-app.js");

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app);
  await app.init();

  const connection = app.get<Connection>(getConnectionToken());
  // Unique and TTL indexes are built in the background; tests that rely on them must not race
  await Promise.all(Object.values(connection.models).map((model) => model.init()));

  return {
    app,
    http: app.getHttpServer() as App,
    connection,
    close: async () => {
      await connection.dropDatabase();
      await app.close();
    },
  };
}

/** Raw `Set-Cookie` values of a response, keyed by cookie name. */
export function cookiesOf(res: request.Response): Record<string, string> {
  const header = res.headers["set-cookie"] as unknown;
  const list = Array.isArray(header) ? (header as string[]) : [];
  return Object.fromEntries(
    list.map((cookie) => {
      const [pair = ""] = cookie.split(";");
      const index = pair.indexOf("=");
      return [pair.slice(0, index), cookie];
    }),
  );
}

export function cookieValue(res: request.Response, name: string): string | undefined {
  const raw = cookiesOf(res)[name];
  return raw?.split(";")[0]?.split("=").slice(1).join("=") || undefined;
}

export interface Session {
  user: UserDto;
  /** Ready for `.set("Cookie", session.cookie)`. */
  cookie: string[];
  accessToken: string;
  refreshToken: string;
}

export async function signIn(t: TestApp, mobile: string): Promise<Session> {
  await request(t.http).post("/v1/auth/otp/request").send({ mobile }).expect(204);
  const res = await request(t.http)
    .post("/v1/auth/otp/verify")
    .send({ mobile, code: OTP_CODE })
    .expect(200);
  const accessToken = cookieValue(res, COOKIE_NAMES.access) ?? "";
  const refreshToken = cookieValue(res, COOKIE_NAMES.refresh) ?? "";
  return {
    user: (res.body as { data: { user: UserDto } }).data.user,
    cookie: [`${COOKIE_NAMES.access}=${accessToken}`, `${COOKIE_NAMES.refresh}=${refreshToken}`],
    accessToken,
    refreshToken,
  };
}

/** Signs in with a role; the role lives in the JWT, so it is set before the session is issued. */
export async function signInAs(t: TestApp, mobile: string, role: Role): Promise<Session> {
  await t.connection
    .collection("users")
    .updateOne(
      { mobile, deletedAt: null },
      { $set: { role }, $setOnInsert: { firstName: null, lastName: null, createdAt: new Date() } },
      { upsert: true },
    );
  return signIn(t, mobile);
}
