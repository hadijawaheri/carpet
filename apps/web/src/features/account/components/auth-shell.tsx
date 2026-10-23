import Link from "next/link";
import type { PropsWithChildren, ReactNode } from "react";

import { Monogram } from "@/components/shared/monogram";
import { paths } from "@/lib/paths";

/** The narrow page frame of sign-in and the account pages. */
export function AuthShell({ title, children }: PropsWithChildren<{ title: ReactNode }>) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-10 px-6 py-16">
      <Link href={paths.home} className="flex items-center gap-3 self-start">
        <Monogram />
        <span className="font-display text-2xl">فرش</span>
      </Link>
      <h1 className="text-5xl">{title}</h1>
      {children}
    </main>
  );
}
