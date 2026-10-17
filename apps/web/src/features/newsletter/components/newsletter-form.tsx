"use client";

import { subscribeNewsletterSchema } from "@farsh/contracts";
import { type FormEvent, useState } from "react";

import { getErrorMessage } from "@/lib/api/parse";

import { useSubscribeNewsletter } from "../queries";

export function NewsletterForm() {
  const mutation = useSubscribeNewsletter();
  const [invalid, setInvalid] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = subscribeNewsletterSchema.safeParse({
      email: new FormData(event.currentTarget).get("email"),
    });
    if (!parsed.success) {
      setInvalid(parsed.error.issues[0]?.message ?? "ایمیل معتبر نیست");
      return;
    }
    setInvalid(null);
    mutation.mutate(parsed.data);
  };

  if (mutation.isSuccess) {
    return (
      <p role="status" className="mt-4 text-sm">
        عضو شدید. فرش‌های تازه را پیش از همه برایتان می‌فرستیم.
      </p>
    );
  }

  const message = invalid ?? (mutation.isError ? getErrorMessage(mutation.error) : null);
  return (
    <form noValidate onSubmit={submit} className="mt-4">
      <div className="flex gap-3 border-b border-foreground/40 focus-within:border-foreground">
        <input
          type="email"
          name="email"
          dir="ltr"
          autoComplete="email"
          placeholder="ایمیل شما"
          aria-label="ایمیل"
          aria-invalid={Boolean(message)}
          className="flex-1 bg-transparent py-2 text-start text-sm outline-none placeholder:text-muted-foreground"
        />
        <button type="submit" disabled={mutation.isPending} className="eyebrow disabled:opacity-50">
          {mutation.isPending ? "…" : "عضویت"}
        </button>
      </div>
      {message ? (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {message}
        </p>
      ) : null}
    </form>
  );
}
