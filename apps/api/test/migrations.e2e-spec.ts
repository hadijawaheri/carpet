import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { migrations } from "../src/database/migrations/index.js";
import type { Migration } from "../src/database/migrator.js";
import { runMigrations } from "../src/database/migrator.js";
import type { TestApp } from "./test-app.js";
import { createTestApp } from "./test-app.js";

let t: TestApp;

beforeAll(async () => {
  t = await createTestApp();
});

afterAll(async () => {
  await t.close();
});

describe("migrations", () => {
  it("applies each migration once, in order", async () => {
    const calls: string[] = [];
    const list: Migration[] = [
      { id: "9001-a", up: () => Promise.resolve(void calls.push("a")) },
      { id: "9002-b", up: () => Promise.resolve(void calls.push("b")) },
    ];
    expect(await runMigrations(t.connection, list)).toEqual(["9001-a", "9002-b"]);
    expect(await runMigrations(t.connection, list)).toEqual([]);
    expect(calls).toEqual(["a", "b"]);
  });

  it("refuses to run while another run holds the lock", async () => {
    await t.connection.collection("migrations_lock").insertOne({ _id: "migrate" } as never);
    await expect(runMigrations(t.connection, [])).rejects.toThrow(/lock/);
    await t.connection.collection("migrations_lock").deleteMany({});
  });

  it("releases the lock when a migration fails", async () => {
    const failing: Migration = { id: "9003-fails", up: () => Promise.reject(new Error("boom")) };
    await expect(runMigrations(t.connection, [failing])).rejects.toThrow("boom");
    expect(await t.connection.collection("migrations_lock").countDocuments()).toBe(0);
    expect(
      await t.connection.collection("migrations").findOne({ _id: "9003-fails" } as never),
    ).toBeNull();
  });

  it("backfills the session start of refresh tokens issued before the cap", async () => {
    const createdAt = new Date("2026-10-01T00:00:00Z");
    await t.connection.collection("refreshtokens").insertOne({ familyId: "old", createdAt });
    await runMigrations(t.connection, migrations);
    const token = await t.connection.collection("refreshtokens").findOne({ familyId: "old" });
    expect(token?.familyStartedAt).toEqual(createdAt);
  });
});
