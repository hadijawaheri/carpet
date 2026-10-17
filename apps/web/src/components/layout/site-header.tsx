import Link from "next/link";

import { paths } from "@/lib/paths";

import { ThemeToggle } from "./theme-toggle";

const nav = [
  { href: paths.home, label: "خانه" },
  { href: paths.designHub, label: "دیزاین هاب" },
];

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-4 px-4 py-6 sm:px-10">
      <Link
        href={paths.home}
        className="flex items-baseline gap-2 rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="font-display text-3xl font-bold text-brand-text">فرش</span>
        <span className="font-latin text-lg text-muted-foreground italic" dir="ltr">
          Farsh
        </span>
      </Link>
      <div className="flex items-center gap-5">
        <nav aria-label="اصلی" className="flex gap-5 text-sm font-semibold">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm underline-offset-8 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
