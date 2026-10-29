import "server-only";

import type { ApiResponse, Carpet, PaginatedResponse } from "@farsh/contracts";
import { carpetSlugSchema } from "@farsh/contracts";

import { ApiError } from "@/lib/api/parse";
import { serverApi } from "@/lib/api/server";

/**
 * Straight from the API, uncached and without the showroom's bundled fallback: the admin must see
 * what is really stored, and an outage must show as an error, not as the sample catalogue.
 */
export async function getAdminCarpets(): Promise<Carpet[]> {
  const { data } = await serverApi<PaginatedResponse<Carpet>>("/carpets?limit=100");
  return data;
}

export async function getAdminCarpet(slug: string): Promise<Carpet | null> {
  if (!carpetSlugSchema.safeParse(slug).success) return null;
  try {
    return (await serverApi<ApiResponse<Carpet>>(`/carpets/${slug}`)).data;
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
