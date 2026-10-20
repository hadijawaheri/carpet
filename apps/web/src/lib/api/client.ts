import { parseResponse } from "./parse";

type ApiInit = Omit<RequestInit, "body"> & { json?: unknown };

/** Browser-side call through the same-origin `/api` rewrite, so cookies stay first-party. */
export async function api<T>(path: string, { json, ...init }: ApiInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(json === undefined ? {} : { "Content-Type": "application/json" }),
      ...init.headers,
    },
    body: json === undefined ? undefined : JSON.stringify(json),
  });
  return parseResponse<T>(res);
}
