"use client";

import { createInquirySchema } from "@farsh/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { showServerError } from "@/lib/form-errors";

import { useCreateInquiry } from "../queries";

// The carpets come from the drawer, not from an input
const formSchema = createInquirySchema.omit({ carpetSlugs: true });

interface InquiryFormProps {
  carpetSlugs: string[];
  onSent: () => void;
}

export function InquiryForm({ carpetSlugs, onSent }: InquiryFormProps) {
  const mutation = useCreateInquiry();
  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: { name: "", mobile: "", message: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync({ ...values, carpetSlugs });
      onSent();
    } catch (e: unknown) {
      // The form sits in the selection drawer, a modal: a toast there would be hidden from AT
      showServerError(e, form.setError, ["name", "mobile", "message"], { inline: true });
    }
  });

  if (mutation.isSuccess) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="size-8 text-gold" strokeWidth={1.3} aria-hidden />
        <p className="font-display text-2xl">درخواست شما ثبت شد</p>
        <p className="text-sm text-muted-foreground">
          کارشناس ما برای قیمت، دیدار حضوری و ارسال با شما تماس می‌گیرد.
        </p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit}>
      <FieldGroup className="gap-4">
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="inquiry-name">نام</FieldLabel>
              <Input
                {...field}
                id="inquiry-name"
                autoComplete="name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="mobile"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="inquiry-mobile">شماره موبایل</FieldLabel>
              <Input
                {...field}
                id="inquiry-mobile"
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
        <Controller
          name="message"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="inquiry-message">پیام (اختیاری)</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="inquiry-message"
                rows={2}
                maxLength={1000}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {form.formState.errors.root?.server && (
          <FieldError errors={[form.formState.errors.root.server]} />
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={carpetSlugs.length === 0 || mutation.isPending}
        >
          {mutation.isPending && <Spinner aria-label="در حال ثبت" />}
          {mutation.isPending ? "در حال ثبت…" : "ثبت درخواست استعلام"}
        </Button>
      </FieldGroup>
    </form>
  );
}
