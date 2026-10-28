import { cn } from "@/lib/utils";

/** Drafts say so up front, so no claim on these pages reads as a final, reviewed fact. */
export function DraftNotice({ className }: { className?: string }) {
  return (
    <p className={cn("border-s-2 border-gold ps-4 text-sm text-muted-foreground", className)}>
      پیش‌نویس: این نوشته هنوز بازبینی کارشناس را نگذرانده است و ممکن است اصلاح شود.
    </p>
  );
}
