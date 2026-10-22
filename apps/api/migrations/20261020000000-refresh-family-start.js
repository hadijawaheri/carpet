// @ts-check

/** Sessions started before the 90-day cap get their first token's creation time as their start. */
export const up = async (/** @type {import("mongodb").Db} */ db) => {
  await db
    .collection("refreshtokens")
    .updateMany({ familyStartedAt: { $exists: false } }, [
      { $set: { familyStartedAt: { $ifNull: ["$createdAt", "$$NOW"] } } },
    ]);
};

// Forward only: a mistake is fixed by a new migration, so every database keeps one history
export const down = () => Promise.resolve();
