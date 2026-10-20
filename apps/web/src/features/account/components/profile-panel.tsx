"use client";

import { updateProfileSchema, type UserDto } from "@farsh/contracts";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/parse";
import { fieldErrors } from "@/lib/field-errors";

import { useLogout, useUpdateProfile } from "../queries";
import { DeleteAccount } from "./delete-account";
import { TextField } from "./text-field";

const optional = (value: FormDataEntryValue | null) => String(value ?? "").trim() || undefined;

export function ProfilePanel({ user }: { user: UserDto }) {
  const update = useUpdateProfile();
  const logout = useLogout();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = updateProfileSchema.safeParse({
      firstName: optional(form.get("firstName")),
      lastName: optional(form.get("lastName")),
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    update.mutate(parsed.data);
  };

  return (
    <div className="flex flex-col gap-10">
      <form noValidate onSubmit={submit} className="flex flex-col gap-5">
        <p className="text-sm text-muted-foreground">
          شماره‌ی ورود:{" "}
          <span dir="ltr" className="text-foreground">
            {user.mobile}
          </span>
        </p>
        <TextField
          id="profile-first-name"
          name="firstName"
          label="نام"
          defaultValue={user.firstName ?? ""}
          error={errors.firstName}
          autoComplete="given-name"
          maxLength={60}
        />
        <TextField
          id="profile-last-name"
          name="lastName"
          label="نام خانوادگی"
          defaultValue={user.lastName ?? ""}
          error={errors.lastName}
          autoComplete="family-name"
          maxLength={60}
        />
        {update.isError ? (
          <p role="alert" className="text-sm text-destructive">
            {getErrorMessage(update.error)}
          </p>
        ) : null}
        {update.isSuccess ? (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-gold" aria-hidden />
            ذخیره شد
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
            ذخیره
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            خروج از حساب
          </Button>
        </div>
      </form>
      <DeleteAccount mobile={user.mobile} />
    </div>
  );
}
