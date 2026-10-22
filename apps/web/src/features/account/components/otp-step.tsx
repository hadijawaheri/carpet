"use client";

import { deleteAccountSchema, normalizeDigits } from "@farsh/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";
import { showServerError } from "@/lib/form-errors";
import { formatNumber } from "@/lib/format";

import { useRequestOtp } from "../queries";

/** The API's per-mobile cooldown; resending earlier only earns a 429. */
const RESEND_AFTER_S = 120;
const CODE_LENGTH = 6;

// Only the code itself; deleteAccountSchema is that one field of verifyOtpSchema
const codeSchema = deleteAccountSchema;

interface OtpStepProps {
  mobile: string;
  submitLabel: string;
  /** Rejects with the API error, which the step shows. */
  onSubmit: (code: string) => Promise<unknown>;
  onBack?: () => void;
}

/** Asks for the six-digit code that was just sent to `mobile`, with a resend countdown. */
export function OtpStep({ mobile, submitLabel, onSubmit, onBack }: OtpStepProps) {
  const resend = useRequestOtp();
  const form = useForm({ resolver: zodResolver(codeSchema), defaultValues: { code: "" } });
  const [sentAt, setSentAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const wait = Math.max(0, RESEND_AFTER_S - Math.floor((now - sentAt) / 1000));

  const submit = form.handleSubmit(async ({ code }) => {
    try {
      await onSubmit(code);
    } catch (e: unknown) {
      showServerError(e, form.setError, ["code"]);
    }
  });

  return (
    <form noValidate onSubmit={submit}>
      <FieldGroup>
        <p className="text-sm text-muted-foreground">
          کد شش‌رقمی به شماره{" "}
          <span dir="ltr" className="text-foreground">
            {mobile}
          </span>{" "}
          پیامک شد.
        </p>
        <Controller
          name="code"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="otp-code">کد تأیید</FieldLabel>
              {/* Digits read left to right even in a Persian page */}
              <div dir="ltr" className="flex justify-end">
                <InputOTP
                  id="otp-code"
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onBlur={field.onBlur}
                  // Persian keyboards type ۰-۹; `pattern` would drop them before onChange sees them
                  onChange={(value) => {
                    const digits = normalizeDigits(value).replace(/\D/g, "");
                    field.onChange(digits);
                    if (digits.length === CODE_LENGTH) void submit();
                  }}
                  maxLength={CODE_LENGTH}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  aria-invalid={fieldState.invalid}
                  pasteTransformer={(text) => normalizeDigits(text).replace(/\D/g, "")}
                >
                  <InputOTPGroup>
                    {Array.from({ length: CODE_LENGTH }, (_, index) => (
                      <InputOTPSlot key={index} index={index} aria-invalid={fieldState.invalid} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner aria-label="در حال بررسی" />}
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
                  onError: (e) => showServerError(e, form.setError, []),
                },
              )
            }
            className="text-madder underline-offset-6 hover:underline disabled:text-muted-foreground disabled:no-underline"
          >
            {wait > 0 ? `ارسال دوباره تا ${formatNumber(wait)} ثانیه دیگر` : "ارسال دوباره‌ی کد"}
          </button>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="text-muted-foreground hover:underline"
            >
              تغییر شماره
            </button>
          ) : null}
        </div>
      </FieldGroup>
    </form>
  );
}
