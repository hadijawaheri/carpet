import { type Carpet, carpetCatalog, carpetSchema, type PaginatedResponse } from "@farsh/contracts";
import { z } from "zod";

import { serverEnv } from "@/lib/env";

const carpetListSchema = z.object({ data: z.array(carpetSchema) });

/**
 * Carpets from the API, refreshed every minute. Falls back to the bundled catalogue when the API is
 * down or not running (local design work, the build itself), so the showroom never renders empty.
 */
export async function getCarpets(): Promise<Carpet[]> {
  try {
    const res = await fetch(`${serverEnv.INTERNAL_API_URL}/v1/carpets?limit=100`, {
      next: { revalidate: 60, tags: ["carpets"] },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return carpetCatalog;
    const body: PaginatedResponse<unknown> = await res.json();
    const parsed = carpetListSchema.safeParse(body);
    return parsed.success && parsed.data.data.length > 0 ? parsed.data.data : carpetCatalog;
  } catch (e: unknown) {
    const reason =
      e instanceof Error ? (e.cause instanceof Error ? e.cause.message : e.message) : e;
    console.warn(`Carpets API unreachable (${String(reason)}); showing the bundled catalogue`);
    return carpetCatalog;
  }
}
