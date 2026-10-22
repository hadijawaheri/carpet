import type { UserDto } from "@farsh/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteAccount, getMe, logout, requestOtp, updateProfile, verifyOtp } from "./api";

export const sessionKey = ["auth", "session"] as const;

/** The session, seeded by the server render (lib/auth/dal.ts) so the first paint needs no fetch. */
export const useSession = (initialData?: UserDto | null) =>
  useQuery({ queryKey: sessionKey, queryFn: getMe, initialData });

export const useRequestOtp = () => useMutation({ mutationFn: requestOtp });

function useSetSession() {
  const client = useQueryClient();
  return (user: UserDto | null) => client.setQueryData<UserDto | null>(sessionKey, user);
}

export function useVerifyOtp() {
  const setSession = useSetSession();
  return useMutation({ mutationFn: verifyOtp, onSuccess: setSession });
}

export function useUpdateProfile() {
  const setSession = useSetSession();
  return useMutation({ mutationFn: updateProfile, onSuccess: setSession });
}

export function useLogout() {
  const setSession = useSetSession();
  return useMutation({ mutationFn: logout, onSettled: () => setSession(null) });
}

export function useDeleteAccount() {
  const setSession = useSetSession();
  return useMutation({ mutationFn: deleteAccount, onSuccess: () => setSession(null) });
}
