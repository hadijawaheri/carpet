"use client";

import { updateProfileSchema, type UserDto } from "@farsh/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { showServerError } from "@/lib/form-errors";
import { paths } from "@/lib/paths";

import { useLogout, useSession, useUpdateProfile } from "../queries";
import { AuthShell } from "./auth-shell";
import { DeleteAccount } from "./delete-account";

const FIELDS = [
  { name: "firstName", label: "نام", autoComplete: "given-name" },
  { name: "lastName", label: "نام خانوادگی", autoComplete: "family-name" },
] as const;

export function ProfilePanel({ initialUser }: { initialUser: UserDto }) {
  const router = useRouter();
  const session = useSession(initialUser);
  const user = session.data ?? initialUser;
  const update = useUpdateProfile();
  const logout = useLogout();
  const form = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { firstName: user.firstName ?? "", lastName: user.lastName ?? "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync(values);
      toast.success("ذخیره شد");
    } catch (e: unknown) {
      showServerError(e, form.setError, ["firstName", "lastName"]);
    }
  });

  const leave = () => {
    router.replace(paths.home);
    router.refresh();
  };

  return (
    <AuthShell title={`سلام${user.firstName ? ` ${user.firstName}` : ""}`}>
      <div className="flex flex-col gap-10">
        <form noValidate onSubmit={onSubmit}>
          <FieldGroup>
            <p className="text-sm text-muted-foreground">
              شماره‌ی ورود:{" "}
              <span dir="ltr" className="text-foreground">
                {user.mobile}
              </span>
            </p>
            {FIELDS.map(({ name, label, autoComplete }) => (
              <Controller
                key={name}
                name={name}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`profile-${name}`}>{label}</FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      id={`profile-${name}`}
                      autoComplete={autoComplete}
                      maxLength={60}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            ))}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={update.isPending}>
                {update.isPending && <Spinner aria-label="در حال ذخیره" />}
                ذخیره
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={logout.isPending}
                onClick={() => logout.mutate(undefined, { onSettled: leave })}
              >
                خروج از حساب
              </Button>
            </div>
          </FieldGroup>
        </form>
        <DeleteAccount mobile={user.mobile} onDeleted={leave} />
      </div>
    </AuthShell>
  );
}
