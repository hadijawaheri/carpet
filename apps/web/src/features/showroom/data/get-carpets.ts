import {
  type Carpet,
  carpetCatalog,
  carpetSchema,
  carpetSlugSchema,
  type PaginatedResponse,
} from "@farsh/contracts";
import { z } from "zod";

import { serverEnv } from "@/lib/env";

const carpetListSchema = z.object({ data: z.array(carpetSchema) });
const carpetResponseSchema = z.object({ data: carpetSchema });

function describe(e: unknown): string {
  const reason = e instanceof Error ? (e.cause instanceof Error ? e.cause.message : e.message) : e;
  return String(reason);
}

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
    console.warn(`Carpets API unreachable (${describe(e)}); showing the bundled catalogue`);
    return carpetCatalog;
  }
}

/**
 * One carpet, or null when no carpet has this slug. A 404 from the API is trusted; any other
 * failure falls back to the bundled catalogue, like the list.
 */
export async function getCarpet(slug: string): Promise<Carpet | null> {
  // Anything that is not a slug never reaches the API's URL
  if (!carpetSlugSchema.safeParse(slug).success) return null;
  const fromCatalogue = () => carpetCatalog.find((carpet) => carpet.slug === slug) ?? null;
  try {
    const res = await fetch(`${serverEnv.INTERNAL_API_URL}/v1/carpets/${slug}`, {
      next: { revalidate: 60, tags: ["carpets", `carpet:${slug}`] },
      signal: AbortSignal.timeout(3000),
    });
    if (res.status === 404) return null;
    if (!res.ok) return fromCatalogue();
    const parsed = carpetResponseSchema.safeParse(await res.json());
    return parsed.success ? parsed.data.data : fromCatalogue();
  } catch (e: unknown) {
    console.warn(`Carpets API unreachable (${describe(e)}); showing the bundled catalogue`);
    return fromCatalogue();
  }
}
