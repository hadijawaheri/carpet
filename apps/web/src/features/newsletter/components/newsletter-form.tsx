"use client";

import { subscribeNewsletterSchema } from "@farsh/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Field, FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { showServerError } from "@/lib/form-errors";

import { useSubscribeNewsletter } from "../queries";

export function NewsletterForm() {
  const mutation = useSubscribeNewsletter();
  const form = useForm({
    resolver: zodResolver(subscribeNewsletterSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values);
    } catch (e: unknown) {
      showServerError(e, form.setError, ["email"]);
    }
  });

  if (mutation.isSuccess) {
    return (
      <p role="status" className="mt-4 text-sm">
        عضو شدید. فرش‌های تازه را پیش از همه برایتان می‌فرستیم.
      </p>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="mt-4">
      <Controller
        name="email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            {/* The design's single underline runs under both the input and its button */}
            <div className="flex gap-3 border-b border-foreground/40 group-data-[invalid=true]/field:border-destructive focus-within:border-foreground">
              <input
                {...field}
                type="email"
                dir="ltr"
                autoComplete="email"
                placeholder="ایمیل شما"
                aria-label="ایمیل"
                aria-invalid={fieldState.invalid}
                className="flex-1 bg-transparent py-2 text-start text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={mutation.isPending}
                className="eyebrow text-foreground disabled:opacity-50"
              >
                {mutation.isPending ? <Spinner aria-label="در حال ثبت" /> : "عضویت"}
              </button>
            </div>
            {fieldState.invalid && <FieldError className="mt-1" errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </form>
  );
}
