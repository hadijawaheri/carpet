import type {
  ApiResponse,
  DeleteAccountInput,
  RequestOtpInput,
  UpdateProfileInput,
  UserDto,
  VerifyOtpInput,
} from "@farsh/contracts";

import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/parse";

let refreshing: Promise<void> | null = null;

/** One refresh at a time: parallel 401s share it, since a rotated token is single-use. */
function refreshSession(): Promise<void> {
  refreshing ??= api<void>("/auth/refresh", { method: "POST" }).finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** Calls an endpoint that needs a session, renewing the 15-minute access cookie once on a 401. */
async function authed<T>(path: string, init?: Parameters<typeof api>[1]): Promise<T> {
  try {
    return await api<T>(path, init);
  } catch (e: unknown) {
    if (!(e instanceof ApiError) || e.status !== 401) throw e;
    await refreshSession();
    return api<T>(path, init);
  }
}

/** The signed-in user, or null when there is no session (a 401 after the refresh attempt). */
export async function getMe(): Promise<UserDto | null> {
  try {
    const body = await authed<ApiResponse<{ user: UserDto }>>("/auth/me");
    return body.data.user;
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

export const requestOtp = (input: RequestOtpInput) =>
  api<void>("/auth/otp/request", { method: "POST", json: input });

export const verifyOtp = async (input: VerifyOtpInput) =>
  (await api<ApiResponse<{ user: UserDto }>>("/auth/otp/verify", { method: "POST", json: input }))
    .data.user;

export const updateProfile = async (input: UpdateProfileInput) =>
  (await authed<ApiResponse<UserDto>>("/users/me", { method: "PATCH", json: input })).data;

export const logout = () => api<void>("/auth/logout", { method: "POST" });

export const deleteAccount = (input: DeleteAccountInput) =>
  authed<void>("/users/me", { method: "DELETE", json: input });
