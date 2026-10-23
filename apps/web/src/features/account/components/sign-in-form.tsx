"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { safeRedirect } from "@/lib/safe-redirect";

import { useVerifyOtp } from "../queries";
import { MobileStep } from "./mobile-step";
import { OtpStep } from "./otp-step";

export function SignInForm({ next }: { next?: string }) {
  const router = useRouter();
  const verify = useVerifyOtp();
  const [mobile, setMobile] = useState<string | null>(null);

  if (!mobile) return <MobileStep onSent={setMobile} />;

  return (
    <OtpStep
      mobile={mobile}
      submitLabel="ورود"
      onSubmit={async (code) => {
        await verify.mutateAsync({ mobile, code });
        router.replace(safeRedirect(next));
        // Server Components behind sign-in read the new cookies on their next render
        router.refresh();
      }}
      onBack={() => setMobile(null)}
    />
  );
}
