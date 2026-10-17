"use client";

import { createInquirySchema } from "@farsh/contracts";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { type FormEvent, useState } from "react";

import { getErrorMessage } from "@/lib/api/parse";
import { fieldErrors } from "@/lib/field-errors";

import { useCreateInquiry } from "../queries";

interface InquiryFormProps {
  carpetSlugs: string[];
  onSent: () => void;
}

export function InquiryForm({ carpetSlugs, onSent }: InquiryFormProps) {
  const mutation = useCreateInquiry();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = createInquirySchema.safeParse({
      name: form.get("name"),
      mobile: form.get("mobile"),
      message: String(form.get("message") ?? "").trim() || undefined,
      carpetSlugs,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data, { onSuccess: onSent });
  };

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

  const disabled = carpetSlugs.length === 0 || mutation.isPending;
  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <Field label="نام" name="name" error={errors.name} autoComplete="name" />
      <Field
        label="شماره موبایل"
        name="mobile"
        error={errors.mobile}
        autoComplete="tel"
        inputMode="tel"
        dir="ltr"
        placeholder="09xxxxxxxxx"
      />
      <Field label="پیام (اختیاری)" name="message" error={errors.message} multiline />
      {errors.carpetSlugs ? <p className="text-sm text-destructive">{errors.carpetSlugs}</p> : null}
      {mutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(mutation.error)}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={disabled}
        className="flex w-full items-center justify-center gap-2 bg-primary py-3.5 text-sm text-primary-foreground transition disabled:opacity-40"
      >
        {mutation.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
        {mutation.isPending ? "در حال ثبت…" : "ثبت درخواست استعلام"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  multiline = false,
  ...input
}: {
  label: string;
  name: string;
  error?: string;
  multiline?: boolean;
  autoComplete?: string;
  inputMode?: "tel";
  dir?: "ltr";
  placeholder?: string;
}) {
  const id = `inquiry-${name}`;
  const errorId = `${id}-error`;
  const className =
    "w-full border-b border-foreground/40 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground aria-invalid:border-destructive";
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="eyebrow text-muted-foreground">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          name={name}
          rows={2}
          maxLength={1000}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`${className} resize-none`}
        />
      ) : (
        <input
          id={id}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`${className} text-start`}
          {...input}
        />
      )}
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
