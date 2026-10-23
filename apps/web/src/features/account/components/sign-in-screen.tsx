import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/dal";
import { safeRedirect } from "@/lib/safe-redirect";

import { AuthShell } from "./auth-shell";
import { SignInForm } from "./sign-in-form";

// The session check lives here, not in proxy.ts: a cookie the API no longer accepts would
// otherwise bounce between /sign-in and /dashboard forever
export async function SignInScreen({ next }: { next?: string }) {
  if (await getSession()) redirect(safeRedirect(next));
  return (
    <AuthShell title="ورود به حساب">
      <SignInForm next={next} />
    </AuthShell>
  );
}
