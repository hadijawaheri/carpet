"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api/parse";

import { useDeleteAccount, useRequestOtp } from "../queries";
import { OtpStep } from "./otp-step";

/** Deleting asks for confirmation, then a fresh code, so an open session alone cannot do it. */
export function DeleteAccount({ mobile, onDeleted }: { mobile: string; onDeleted: () => void }) {
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
          onSubmit={async (code) => {
            await remove.mutateAsync({ code });
            toast.success("حساب شما حذف شد");
            onDeleted();
          }}
        />
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              className="self-start"
              disabled={request.isPending}
            >
              {request.isPending && <Spinner aria-label="در حال ارسال" />}
              حذف حساب
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>حساب حذف شود؟</AlertDialogTitle>
              <AlertDialogDescription>
                این کار برگشت‌پذیر نیست. برای اطمینان، یک کد تأیید به{" "}
                <span dir="ltr">{mobile}</span> فرستاده می‌شود.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>انصراف</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() =>
                  request.mutate(
                    { mobile },
                    {
                      onSuccess: () => setAsked(true),
                      onError: (e) => toast.error(getErrorMessage(e)),
                    },
                  )
                }
              >
                ارسال کد حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </section>
  );
}
