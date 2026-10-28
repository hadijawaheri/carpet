import { carpetCatalog } from "@farsh/contracts";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { CarpetsService } from "../src/modules/carpets/carpets.service.js";
import type { Session, TestApp } from "./test-app.js";
import { createTestApp, signInAs } from "./test-app.js";

let t: TestApp;
let admin: Session;
let user: Session;

const newCarpet = {
  slug: "tabriz-test",
  name: "تبریز آزمایشی",
  material: "wool",
  widthCm: 120,
  lengthCm: 180,
  image: "/carpets/kashan-red.jpg",
  imageAspect: 0.6,
};

beforeAll(async () => {
  t = await createTestApp();
  await t.app.get(CarpetsService).upsertMany(carpetCatalog, false);
  admin = await signInAs(t, "09121111111", "admin");
  user = await signInAs(t, "09122222222", "user");
});

afterAll(async () => {
  await t.close();
});

describe("public catalogue", () => {
  it("lists the seed carpets in catalogue order with paging meta", async () => {
    const res = await request(t.http).get("/v1/carpets").expect(200);
    expect(res.body.data).toEqual(carpetCatalog);
    expect(res.body.meta).toEqual({ page: 1, limit: 20, totalItems: 5, totalPages: 1 });
  });

  it("filters by material and pages", async () => {
    const silk = await request(t.http).get("/v1/carpets?material=silk").expect(200);
    expect(silk.body.data.map((c: { slug: string }) => c.slug)).toEqual([
      "medallion-black",
      "navy-medallion",
    ]);
    const page = await request(t.http).get("/v1/carpets?limit=2&page=3").expect(200);
    expect(page.body.data).toHaveLength(1);
    expect(page.body.meta).toEqual({ page: 3, limit: 2, totalItems: 5, totalPages: 3 });
    await request(t.http).get("/v1/carpets?material=cotton").expect(400);
  });

  it("returns one carpet and a Persian 404 for an unknown slug", async () => {
    const res = await request(t.http).get("/v1/carpets/kashan-red").expect(200);
    expect(res.body).toEqual({ data: carpetCatalog.find((c) => c.slug === "kashan-red") });
    const missing = await request(t.http).get("/v1/carpets/nope").expect(404);
    expect(missing.body).toMatchObject({ code: "NOT_FOUND", message: "فرش یافت نشد" });
  });

  it("re-seeding is idempotent", async () => {
    const { inserted } = await t.app.get(CarpetsService).upsertMany(carpetCatalog, false);
    expect(inserted).toBe(0);
  });
});

describe("admin", () => {
  it("needs a session (401) and the admin role (403)", async () => {
    await request(t.http).post("/v1/carpets").send(newCarpet).expect(401);
    const res = await request(t.http)
      .post("/v1/carpets")
      .set("Cookie", user.cookie)
      .send(newCarpet)
      .expect(403);
    expect(res.body).toMatchObject({ code: "FORBIDDEN" });
  });

  it("creates, rejects a duplicate slug, updates and soft-deletes a carpet", async () => {
    const created = await request(t.http)
      .post("/v1/carpets")
      .set("Cookie", admin.cookie)
      .send(newCarpet)
      .expect(201);
    expect(created.body.data).toEqual({ ...newCarpet, isPlaceholder: false });
    expect(created.body.data).not.toHaveProperty("_id");

    const dup = await request(t.http)
      .post("/v1/carpets")
      .set("Cookie", admin.cookie)
      .send(newCarpet)
      .expect(409);
    expect(dup.body).toMatchObject({ code: "CONFLICT" });

    const updated = await request(t.http)
      .patch("/v1/carpets/tabriz-test")
      .set("Cookie", admin.cookie)
      .send({ priceRial: 1_500_000_000, slug: "renamed" })
      .expect(200);
    expect(updated.body.data).toMatchObject({ slug: "tabriz-test", priceRial: 1_500_000_000 });

    await request(t.http)
      .patch("/v1/carpets/tabriz-test")
      .set("Cookie", user.cookie)
      .send({ name: "x" })
      .expect(403);

    await request(t.http).delete("/v1/carpets/tabriz-test").set("Cookie", admin.cookie).expect(204);
    await request(t.http).get("/v1/carpets/tabriz-test").expect(404);
    const list = await request(t.http).get("/v1/carpets").expect(200);
    expect(list.body.meta.totalItems).toBe(5);
    await request(t.http).delete("/v1/carpets/tabriz-test").set("Cookie", admin.cookie).expect(404);

    // The document stays, marked deleted, and its slug is free again
    const raw = await t.connection.collection("carpets").findOne({ slug: "tabriz-test" });
    expect(raw?.deletedAt).toBeInstanceOf(Date);
    await request(t.http)
      .post("/v1/carpets")
      .set("Cookie", admin.cookie)
      .send(newCarpet)
      .expect(201);
  });

  it("records a carpet's provenance for its certificate", async () => {
    const provenance = { origin: "کاشان", workshop: "کارگاه آزمایشی", wovenYear: 1398 };
    const updated = await request(t.http)
      .patch("/v1/carpets/tabriz-test")
      .set("Cookie", admin.cookie)
      .send({ provenance: { ...provenance, origin: " کاشان " } })
      .expect(200);
    expect(updated.body.data.provenance).toEqual(provenance);
    const fetched = await request(t.http).get("/v1/carpets/tabriz-test").expect(200);
    expect(fetched.body.data.provenance).toEqual(provenance);

    await request(t.http)
      .patch("/v1/carpets/tabriz-test")
      .set("Cookie", admin.cookie)
      .send({ provenance: { wovenYear: 2019 } })
      .expect(400);
  });
});
