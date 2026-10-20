import type { Migration } from "../migrator.js";

/** Sessions started before the 90-day cap get their first token's creation time as their start. */
export const refreshFamilyStart: Migration = {
  id: "0001-refresh-family-start",
  up: async (db) => {
    await db
      .collection("refreshtokens")
      .updateMany({ familyStartedAt: { $exists: false } }, [
        { $set: { familyStartedAt: { $ifNull: ["$createdAt", "$$NOW"] } } },
      ]);
  },
};
