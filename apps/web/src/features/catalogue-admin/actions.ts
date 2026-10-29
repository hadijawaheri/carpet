"use server";

import { updateTag } from "next/cache";

import { requireRole } from "@/lib/auth/dal";

/**
 * Called after each catalogue change, so the showroom shows it on the next visit instead of after
 * its one-minute cache. Admin only: anyone could otherwise make the site refetch on demand.
 */
export async function refreshShowroom(): Promise<void> {
  await requireRole("admin");
  updateTag("carpets");
}
