import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Always pass a Persian `aria-label`; the default only covers a forgotten one. */
export function Spinner({ className, ...props }: ComponentProps<"svg">) {
  return (
    <LoaderCircle
      role="status"
      aria-label="در حال بارگذاری"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}
