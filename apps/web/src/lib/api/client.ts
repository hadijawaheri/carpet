import { paths } from "../paths";
import { parseResponse } from "./parse";

type ApiInit = Omit<RequestInit, "body"> & { json?: unknown };

let refreshing: Promise<boolean> | null = null;

/** One refresh at a time: parallel 401s share it, since a rotated refresh token is single-use. */
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch("/api/auth/refresh", { method: "POST", credentials: "include" })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/**
 * Browser-side call through the same-origin `/api` rewrite, so cookies stay first-party. A 401
 * renews the 15-minute access cookie once; when that fails too, a page behind sign-in goes to it.
 */
export async function api<T>(path: string, { json, ...init }: ApiInit = {}): Promise<T> {
  const send = () =>
    fetch(`/api${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(json === undefined ? {} : { "Content-Type": "application/json" }),
        ...init.headers,
      },
      body: json === undefined ? undefined : JSON.stringify(json),
    });

  let res = await send();
  // The sign-in calls answer 401 for a wrong code; only /auth/me reads the session itself
  if (res.status === 401 && (!path.startsWith("/auth/") || path === "/auth/me")) {
    if (await refreshSession()) {
      res = await send();
    } else if (window.location.pathname.startsWith(paths.dashboard)) {
      // Hard navigation on purpose: drops all client state of the expired session
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(
        `${paths.signIn}?next=${encodeURIComponent(window.location.pathname)}`,
      );
    }
  }
  return parseResponse<T>(res);
}
