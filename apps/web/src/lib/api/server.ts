import "server-only";

import { cookies, headers } from "next/headers";

import { serverEnv } from "../env";
import { parseResponse } from "./parse";

/**
 * Server Component call straight to the API with the visitor's cookies. The visitor's address is
 * passed on, or every visitor would share this server's rate limit.
 */
export async function serverApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const [cookieStore, incoming] = await Promise.all([cookies(), headers()]);
  const forwardedFor = incoming.get("x-forwarded-for");
  const res = await fetch(`${serverEnv.INTERNAL_API_URL}/v1${path}`, {
    ...init,
    headers: {
      cookie: cookieStore.toString(),
      ...(forwardedFor ? { "x-forwarded-for": forwardedFor } : {}),
      ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...init.headers,
    },
    cache: "no-store",
  });
  return parseResponse<T>(res);
}
