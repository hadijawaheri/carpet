"use client";

import { requestOtpSchema } from "@farsh/contracts";
import { LoaderCircle } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/parse";
import { fieldErrors } from "@/lib/field-errors";

import { useRequestOtp, useVerifyOtp } from "../queries";
import { OtpStep } from "./otp-step";
import { TextField } from "./text-field";

export function SignInForm() {
  const request = useRequestOtp();
  const verify = useVerifyOtp();
  const [mobile, setMobile] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submitMobile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = requestOtpSchema.safeParse({
      mobile: new FormData(event.currentTarget).get("mobile"),
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    request.mutate(parsed.data, { onSuccess: () => setMobile(parsed.data.mobile) });
  };

  if (mobile) {
    return (
      <OtpStep
        mobile={mobile}
        submitLabel="ورود"
        pending={verify.isPending}
        error={verify.isError ? verify.error : null}
        onSubmit={(code) => verify.mutate({ mobile, code })}
        onBack={() => {
          verify.reset();
          setMobile(null);
        }}
      />
    );
  }

  return (
    <form noValidate onSubmit={submitMobile} className="flex flex-col gap-5">
      <TextField
        id="sign-in-mobile"
        name="mobile"
        label="شماره موبایل"
        error={errors.mobile}
        autoComplete="tel"
        inputMode="tel"
        dir="ltr"
        placeholder="09xxxxxxxxx"
      />
      {request.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(request.error)}
        </p>
      ) : null}
      <Button type="submit" disabled={request.isPending}>
        {request.isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
        دریافت کد تأیید
      </Button>
    </form>
  );
}
