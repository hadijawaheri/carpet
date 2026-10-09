import type { PropsWithChildren } from "react";

export function HubSection({
  id,
  index,
  title,
  latin,
  lead,
  children,
}: PropsWithChildren<{ id: string; index: string; title: string; latin: string; lead: string }>) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-8 border-t border-border py-16 sm:py-24"
    >
      <div className="mb-10 grid gap-4 sm:mb-14 sm:grid-cols-[10rem_1fr] sm:gap-10">
        <p className="flex flex-col items-start gap-1 font-mono text-xs tracking-widest text-muted-foreground">
          <span dir="ltr">{index}</span>
          <span dir="ltr" className="font-latin text-lg tracking-normal text-brand-text italic">
            {latin}
          </span>
        </p>
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 id={`${id}-title`} className="font-display text-display-l font-bold">
            {title}
          </h2>
          <p className="text-lead text-muted-foreground">{lead}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
