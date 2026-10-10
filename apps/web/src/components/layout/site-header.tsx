import Link from "next/link";

import { paths } from "@/lib/paths";

const nav = [
  { href: paths.hall, label: "تالار" },
  { href: paths.study, label: "ذره‌بین" },
  { href: paths.collection, label: "مجموعه" },
  { href: paths.research, label: "پژوهش" },
  { href: paths.designHub, label: "راهنمای طراحی" },
];

/** Gallery wayfinding: the wordmark is painted on the wall, the links are the room signs. */
export function SiteHeader() {
  return (
    <header className="relative z-20 flex flex-wrap items-baseline justify-between gap-x-10 gap-y-3 px-4 pt-6 sm:px-10">
      <Link
        href={paths.home}
        className="flex items-baseline gap-3 rounded-sm focus-visible:ring-2 focus-visible:ring-saffron focus-visible:outline-none"
      >
        <span className="font-display text-4xl leading-none font-bold">فرش</span>
        <span className="text-label text-on-wall-muted">تالار لمسی فرش ایرانی</span>
      </Link>
      <nav aria-label="تالارها">
        <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-block rounded-sm py-1 decoration-saffron underline-offset-8 hover:underline focus-visible:ring-2 focus-visible:ring-saffron focus-visible:outline-none"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
