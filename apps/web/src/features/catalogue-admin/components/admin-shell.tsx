import Link from "next/link";
import type { PropsWithChildren, ReactNode } from "react";

import { paths } from "@/lib/paths";

/** The frame of the catalogue pages: a way back, a title and an optional action beside it. */
export function AdminShell({
  title,
  back,
  action,
  children,
}: PropsWithChildren<{
  title: ReactNode;
  back: { href: string; label: string };
  action?: ReactNode;
}>) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-10 px-6 py-16">
      <Link
        href={back.href}
        className="self-start text-sm text-madder underline-offset-6 hover:underline"
      >
        <span aria-hidden="true" className="inline-block rtl:rotate-180">
          ←
        </span>{" "}
        {back.label}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-5xl">{title}</h1>
        {action}
      </div>
      {children}
    </main>
  );
}

export const catalogueBack = { href: paths.catalogue, label: "همه‌ی فرش‌ها" };
