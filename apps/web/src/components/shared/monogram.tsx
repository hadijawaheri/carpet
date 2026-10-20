import { cn } from "@/lib/utils";

/** The brand mark: the first letter of فرش set in a gold diamond, like a carpet's central toranj. */
export function Monogram({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-9 shrink-0 rotate-45 items-center justify-center border border-gold",
        className,
      )}
    >
      <span className="-rotate-45 font-display text-xl leading-none text-foreground">ف</span>
    </span>
  );
}
