import type { Carpet } from "@farsh/contracts";
import { carpetSchema } from "@farsh/contracts";

import type { CarpetEntity } from "./schemas/carpet.schema.js";

/** Parsing through the contract drops Mongo fields (_id, timestamps, deletedAt) and nulls. */
export function toCarpetDto(carpet: CarpetEntity): Carpet {
  return carpetSchema.parse({
    slug: carpet.slug,
    name: carpet.name,
    material: carpet.material,
    widthCm: carpet.widthCm,
    lengthCm: carpet.lengthCm,
    density: carpet.density ?? undefined,
    image: carpet.image,
    imageAspect: carpet.imageAspect,
    priceRial: carpet.priceRial ?? undefined,
    isPlaceholder: carpet.isPlaceholder,
  });
}
