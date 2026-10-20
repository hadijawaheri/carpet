import type { UserDto } from "@farsh/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteAccount, getMe, logout, requestOtp, updateProfile, verifyOtp } from "./api";

const meKey = ["auth", "me"] as const;

export const useMe = () => useQuery({ queryKey: meKey, queryFn: getMe, retry: 1 });

export const useRequestOtp = () => useMutation({ mutationFn: requestOtp });

export function useVerifyOtp() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: verifyOtp,
    onSuccess: (user) => client.setQueryData<UserDto | null>(meKey, user),
  });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => client.setQueryData<UserDto | null>(meKey, user),
  });
}

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSettled: () => client.setQueryData<UserDto | null>(meKey, null),
  });
}

export function useDeleteAccount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => client.setQueryData<UserDto | null>(meKey, null),
  });
}
