"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/parse";

import { useDeleteAccount, useRequestOtp } from "../queries";
import { OtpStep } from "./otp-step";

/** Deleting asks for a fresh code, so someone holding an open session alone cannot do it. */
export function DeleteAccount({ mobile }: { mobile: string }) {
  const request = useRequestOtp();
  const remove = useDeleteAccount();
  const [asked, setAsked] = useState(false);

  return (
    <section aria-labelledby="delete-account" className="flex flex-col gap-4 border-t pt-8">
      <h2 id="delete-account" className="font-display text-2xl">
        حذف حساب
      </h2>
      <p className="text-sm text-muted-foreground">
        با حذف حساب، نام شما پاک می‌شود و از همه‌ی دستگاه‌ها خارج می‌شوید.
      </p>
      {asked ? (
        <OtpStep
          mobile={mobile}
          submitLabel="حذف همیشگی حساب"
          pending={remove.isPending}
          error={remove.isError ? remove.error : null}
          onSubmit={(code) => remove.mutate({ code })}
        />
      ) : (
        <>
          {request.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {getErrorMessage(request.error)}
            </p>
          ) : null}
          <Button
            type="button"
            variant="destructive"
            className="self-start"
            disabled={request.isPending}
            onClick={() => request.mutate({ mobile }, { onSuccess: () => setAsked(true) })}
          >
            {request.isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
            ارسال کد برای حذف حساب
          </Button>
        </>
      )}
    </section>
  );
}
