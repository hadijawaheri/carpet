"use client";

import { requestOtpSchema } from "@farsh/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { showServerError } from "@/lib/form-errors";

import { useRequestOtp } from "../queries";

interface MobileStepProps {
  onSent: (mobile: string) => void;
}

export function MobileStep({ onSent }: MobileStepProps) {
  const form = useForm({
    resolver: zodResolver(requestOtpSchema),
    mode: "onTouched",
    defaultValues: { mobile: "" },
  });
  const requestOtp = useRequestOtp();

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await requestOtp.mutateAsync(values);
      onSent(values.mobile);
    } catch (e: unknown) {
      showServerError(e, form.setError, ["mobile"]);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Controller
          name="mobile"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-in-mobile">شماره موبایل</FieldLabel>
              <Input
                {...field}
                id="sign-in-mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                dir="ltr"
                placeholder="09xxxxxxxxx"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button type="submit" disabled={requestOtp.isPending}>
          {requestOtp.isPending && <Spinner aria-label="در حال ارسال" />}
          دریافت کد تأیید
        </Button>
      </FieldGroup>
    </form>
  );
}
