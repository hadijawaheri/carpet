import Link from "next/link";

import { paths } from "@/lib/paths";

export function SiteHeader() {
  return (
    <header className="flex items-baseline justify-between gap-4 px-4 py-6 sm:px-10">
      <Link
        href={paths.home}
        className="flex items-baseline gap-2 rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="font-display text-3xl font-bold text-brand-text">فرش</span>
        <span className="text-lg text-muted-foreground italic" dir="ltr">
          Farsh
        </span>
      </Link>
      <p className="font-mono text-xs tracking-wider text-muted-foreground" dir="ltr">
        SKELETON · STAGE 1
      </p>
    </header>
  );
}
