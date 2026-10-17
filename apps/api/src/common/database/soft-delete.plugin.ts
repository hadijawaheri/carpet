import type { Query, Schema } from "mongoose";

/** Adds `deletedAt` and hides soft-deleted documents from find/count/update queries. `aggregate()` is not covered. */
export function softDeletePlugin(schema: Schema): void {
  schema.add({ deletedAt: { type: Date, default: null } });
  schema.index({ deletedAt: 1 });
  schema.pre(/^(find|count|update)/, function (this: Query<unknown, unknown>) {
    if (!this.getOptions().withDeleted) this.where({ deletedAt: null });
  });
}
