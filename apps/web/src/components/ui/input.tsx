import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

// The design's underlined field on linen, instead of shadcn's boxed input
export function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 border-b border-foreground/40 bg-transparent py-2 text-start text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}
