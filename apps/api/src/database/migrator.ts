import type { Connection, mongo } from "mongoose";

export interface Migration {
  /** Sortable and never renamed once deployed, e.g. "0001-refresh-family-start". */
  id: string;
  up: (db: mongo.Db) => Promise<void>;
}

const APPLIED = "migrations";
const LOCK = "migrations_lock";
const LOCK_ID = "migrate";

/**
 * Applies, in order, every migration not yet recorded in `migrations`. A lock document stops two
 * deploys from running the same migration at once. Migrations only go forward: a mistake is fixed
 * by a new migration, which keeps every database on one history.
 */
export async function runMigrations(
  connection: Connection,
  migrations: readonly Migration[],
): Promise<string[]> {
  const db = connection.db;
  if (!db) throw new Error("The database connection is not open");

  const ids = migrations.map((m) => m.id);
  if (new Set(ids).size !== ids.length) throw new Error("Two migrations share an id");
  if (ids.some((id, i) => i > 0 && id <= (ids[i - 1] ?? ""))) {
    throw new Error("Migrations must be listed in ascending id order");
  }

  const lock = db.collection<{ _id: string; at: Date }>(LOCK);
  try {
    await lock.insertOne({ _id: LOCK_ID, at: new Date() });
  } catch (e: unknown) {
    throw new Error(
      `Another migration run holds the lock; if none is running, delete it: db.${LOCK}.deleteOne({ _id: "${LOCK_ID}" })`,
      { cause: e },
    );
  }

  const applied = db.collection<{ _id: string; appliedAt: Date }>(APPLIED);
  const ran: string[] = [];
  try {
    const done = new Set(
      (await applied.find({}, { projection: { _id: 1 } }).toArray()).map((d) => d._id),
    );
    for (const migration of migrations) {
      if (done.has(migration.id)) continue;
      await migration.up(db);
      await applied.insertOne({ _id: migration.id, appliedAt: new Date() });
      ran.push(migration.id);
    }
  } finally {
    await lock.deleteOne({ _id: LOCK_ID });
  }
  return ran;
}
