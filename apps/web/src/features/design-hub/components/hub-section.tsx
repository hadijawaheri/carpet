import type { PropsWithChildren } from "react";

export function HubSection({
  id,
  title,
  lead,
  children,
}: PropsWithChildren<{ id: string; title: string; lead: string }>) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-8 border-t border-on-wall-muted/25 py-16 sm:py-24"
    >
      <div className="mb-10 flex max-w-2xl flex-col gap-3 sm:mb-14">
        <h2 id={`${id}-title`} className="font-display text-display-l font-bold">
          {title}
        </h2>
        <p className="text-lead text-on-wall-muted">{lead}</p>
      </div>
      {children}
    </section>
  );
}
