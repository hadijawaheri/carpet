"use client";

import { useRouter } from "next/navigation";
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
import { paths } from "@/lib/paths";

import { refreshShowroom } from "../actions";
import { deleteCarpet } from "../api";

export function DeleteCarpet({ slug, name }: { slug: string; name: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const remove = async () => {
    setPending(true);
    try {
      await deleteCarpet(slug);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e));
      setPending(false);
      return;
    }
    // Removed either way; a failed refresh only means the showroom catches up within a minute
    await refreshShowroom().catch(() => undefined);
    toast.success(`«${name}» از ویترین برداشته شد`);
    router.push(paths.catalogue);
  };

  return (
    <section aria-labelledby="delete-carpet" className="flex flex-col gap-4 border-t pt-8">
      <h2 id="delete-carpet" className="font-display text-2xl">
        برداشتن از ویترین
      </h2>
      <p className="text-sm text-muted-foreground">
        فرش از ویترین و جست‌وجو برداشته می‌شود. اطلاعاتش در پایگاه داده می‌ماند.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="destructive" className="self-start" disabled={pending}>
            {pending && <Spinner aria-label="در حال حذف" />}
            برداشتن این فرش
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>«{name}» برداشته شود؟</AlertDialogTitle>
            <AlertDialogDescription>
              صفحه‌ی این فرش دیگر باز نمی‌شود و پیوندهای اشتراک‌گذاشته‌اش کار نمی‌کنند.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void remove()}>
              برداشتن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
