"use client";

import { verifyOtpSchema } from "@farsh/contracts";
import { LoaderCircle } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/parse";
import { formatNumber } from "@/lib/format";

import { useRequestOtp } from "../queries";
import { TextField } from "./text-field";

/** The API's per-mobile cooldown; resending earlier only earns a 429. */
const RESEND_AFTER_S = 120;

interface OtpStepProps {
  mobile: string;
  submitLabel: string;
  pending: boolean;
  error: unknown;
  onSubmit: (code: string) => void;
  onBack?: () => void;
}

/** Asks for the six-digit code that was just sent to `mobile`, with a resend countdown. */
export function OtpStep({ mobile, submitLabel, pending, error, onSubmit, onBack }: OtpStepProps) {
  const resend = useRequestOtp();
  const [fieldError, setFieldError] = useState<string>();
  const [sentAt, setSentAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const wait = Math.max(0, RESEND_AFTER_S - Math.floor((now - sentAt) / 1000));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = verifyOtpSchema.shape.code.safeParse(
      new FormData(event.currentTarget).get("code"),
    );
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "کد تأیید شش رقم است");
      return;
    }
    setFieldError(undefined);
    onSubmit(parsed.data);
  };

  const shownError = error ?? (resend.isError ? resend.error : null);
  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        کد شش‌رقمی به شماره{" "}
        <span dir="ltr" className="text-foreground">
          {mobile}
        </span>{" "}
        پیامک شد.
      </p>
      <TextField
        id="otp-code"
        name="code"
        label="کد تأیید"
        error={fieldError}
        autoComplete="one-time-code"
        inputMode="numeric"
        dir="ltr"
        maxLength={6}
        autoFocus
      />
      {shownError ? (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(shownError)}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
        {submitLabel}
      </Button>
      <div className="flex items-center justify-between gap-4 text-sm">
        <button
          type="button"
          disabled={wait > 0 || resend.isPending}
          onClick={() =>
            resend.mutate(
              { mobile },
              {
                onSuccess: () => {
                  setSentAt(Date.now());
                  setNow(Date.now());
                },
              },
            )
          }
          className="text-madder underline-offset-6 hover:underline disabled:text-muted-foreground disabled:no-underline"
        >
          {wait > 0 ? `ارسال دوباره تا ${formatNumber(wait)} ثانیه دیگر` : "ارسال دوباره‌ی کد"}
        </button>
        {onBack ? (
          <button type="button" onClick={onBack} className="text-muted-foreground hover:underline">
            تغییر شماره
          </button>
        ) : null}
      </div>
    </form>
  );
}
