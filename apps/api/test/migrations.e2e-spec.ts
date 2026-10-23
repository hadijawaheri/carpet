import { config, status, up } from "migrate-mongo";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { TestApp } from "./test-app.js";
import { createTestApp } from "./test-app.js";

let t: TestApp;

beforeAll(async () => {
  t = await createTestApp();
  // The CLI's own config, pointed at this test's database (it reads DATABASE_URL on import)
  const { default: cliConfig } = await import("../migrate-mongo-config.js");
  config.set({ ...cliConfig, migrationsDir: new URL("../migrations", import.meta.url).pathname });
});

afterAll(async () => {
  await t.close();
});

const db = () => {
  if (!t.connection.db) throw new Error("not connected");
  return t.connection.db;
};

describe("migrations (migrate-mongo)", () => {
  it("backfills the session start of refresh tokens issued before the cap, once", async () => {
    const createdAt = new Date("2026-10-01T00:00:00Z");
    await t.connection.collection("refreshtokens").insertOne({ familyId: "old", createdAt });

    expect(await up(db(), t.connection.getClient())).toEqual([
      "20261020000000-refresh-family-start.js",
    ]);
    const token = await t.connection.collection("refreshtokens").findOne({ familyId: "old" });
    expect(token?.familyStartedAt).toEqual(createdAt);

    expect(await up(db(), t.connection.getClient())).toEqual([]);
    expect((await status(db())).every((s) => s.appliedAt !== "PENDING")).toBe(true);
  });

  it("refuses to run while another run holds the lock", async () => {
    await t.connection.collection("changelog_lock").insertOne({ createdAt: new Date() });
    await expect(up(db(), t.connection.getClient())).rejects.toThrow(/lock/);
    await t.connection.collection("changelog_lock").deleteMany({});
  });
});
