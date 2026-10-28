"use client";

import type { Carpet } from "@farsh/contracts";

import { useShowroom } from "./showroom-store";

/** The page's version of the quick view's buttons: the inquiry list is the shop's only checkout. */
export function CarpetActions({ carpet }: { carpet: Carpet }) {
  const { addToSelection, selection } = useShowroom();
  const added = selection.some((c) => c.slug === carpet.slug);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        disabled={added}
        onClick={() => addToSelection(carpet)}
        className="flex-1 bg-primary py-4 text-sm text-primary-foreground transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-lift disabled:opacity-60"
      >
        {added ? "در فهرست شماست" : "افزودن به فهرست"}
      </button>
      <button
        type="button"
        onClick={() => addToSelection(carpet, { ask: true })}
        className="flex-1 border border-foreground py-4 text-center text-sm transition hover:bg-card"
      >
        پرسیدن از کارشناس
      </button>
    </div>
  );
}
