import "server-only";

import { type ApiResponse, COOKIE_NAMES, type Role, type UserDto } from "@farsh/contracts";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { ApiError } from "../api/parse";
import { serverApi } from "../api/server";
import { paths } from "../paths";

/** The signed-in user for this request, or null. One API call per render, however many callers. */
export const getSession = cache(async (): Promise<UserDto | null> => {
  // The API answers 401 without an access cookie anyway; skipping the call keeps anonymous pages
  // like sign-in rendering while the API is down.
  if (!(await cookies()).has(COOKIE_NAMES.access)) return null;
  try {
    const { data } = await serverApi<ApiResponse<{ user: UserDto }>>("/auth/me");
    return data.user;
  } catch (e: unknown) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 404)) return null;
    throw e;
  }
});

// Call close to data access (pages, actions), not only in layouts: layouts do not re-render on
// navigation. proxy.ts only redirects optimistically; the API guards are the real check.
export async function requireSession(next?: string): Promise<UserDto> {
  const user = await getSession();
  if (!user) redirect(next ? `${paths.signIn}?next=${encodeURIComponent(next)}` : paths.signIn);
  return user;
}

export async function requireRole(role: Role, next?: string): Promise<UserDto> {
  const user = await requireSession(next);
  if (user.role !== role) redirect(paths.home);
  return user;
}
