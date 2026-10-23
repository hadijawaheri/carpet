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

/** The signed-in user, or null when there is no session (a 401 after the refresh attempt). */
export async function getMe(): Promise<UserDto | null> {
  try {
    return (await api<ApiResponse<{ user: UserDto }>>("/auth/me")).data.user;
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

export const logout = () => api<void>("/auth/logout", { method: "POST" });

export const updateProfile = async (input: UpdateProfileInput) =>
  (await api<ApiResponse<UserDto>>("/users/me", { method: "PATCH", json: input })).data;

export const deleteAccount = (input: DeleteAccountInput) =>
  api<void>("/users/me", { method: "DELETE", json: input });
