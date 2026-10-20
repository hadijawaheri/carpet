"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";

import { Monogram } from "@/components/shared/monogram";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/parse";
import { paths } from "@/lib/paths";

import { useMe } from "../queries";
import { ProfilePanel } from "./profile-panel";
import { SignInForm } from "./sign-in-form";

export function AccountPage() {
  const me = useMe();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-10 px-6 py-16">
      <Link href={paths.home} className="flex items-center gap-3 self-start">
        <Monogram />
        <span className="font-display text-2xl">فرش</span>
      </Link>
      <h1 className="text-5xl">
        {me.data ? `سلام${me.data.firstName ? ` ${me.data.firstName}` : ""}` : "حساب کاربری"}
      </h1>
      {me.isPending ? (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          در حال بارگذاری…
        </p>
      ) : me.isError ? (
        <div role="alert" className="flex flex-col items-start gap-4">
          <p className="text-sm text-destructive">{getErrorMessage(me.error)}</p>
          <Button variant="secondary" onClick={() => void me.refetch()}>
            تلاش دوباره
          </Button>
        </div>
      ) : me.data ? (
        <ProfilePanel user={me.data} />
      ) : (
        <SignInForm />
      )}
    </main>
  );
}
