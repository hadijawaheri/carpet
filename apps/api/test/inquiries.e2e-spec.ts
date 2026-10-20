import { carpetCatalog } from "@farsh/contracts";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { CarpetsService } from "../src/modules/carpets/carpets.service.js";
import type { Session, TestApp } from "./test-app.js";
import { createTestApp, signInAs } from "./test-app.js";

let t: TestApp;
let admin: Session;
let user: Session;

const valid = {
  name: "هادی جواهری",
  mobile: "۰۹۱۲۳۴۵۶۷۸۹",
  carpetSlugs: ["kashan-red", "navy-medallion"],
  message: "اندازه ۲×۳ هم دارید؟",
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

describe("POST /v1/inquiries", () => {
  it("stores a valid inquiry as new and returns it", async () => {
    const res = await request(t.http).post("/v1/inquiries").send(valid).expect(201);
    expect(res.body.data).toMatchObject({
      name: "هادی جواهری",
      mobile: "09123456789",
      carpetSlugs: ["kashan-red", "navy-medallion"],
      status: "new",
    });
    expect(res.body.data.id).toMatch(/^[a-f0-9]{24}$/);
  });

  it("strips unknown fields such as an injected status", async () => {
    const res = await request(t.http)
      .post("/v1/inquiries")
      .send({ ...valid, status: "closed", isAdmin: true })
      .expect(201);
    expect(res.body.data.status).toBe("new");
    const raw = await t.connection.collection("inquiries").findOne({});
    expect(raw).not.toHaveProperty("isAdmin");
  });

  it("rejects a slug that is not a live carpet", async () => {
    const res = await request(t.http)
      .post("/v1/inquiries")
      .send({ ...valid, carpetSlugs: ["kashan-red", "ghost-carpet"] })
      .expect(400);
    expect(res.body).toMatchObject({
      statusCode: 400,
      code: "VALIDATION_FAILED",
      details: [{ path: "carpetSlugs" }],
    });
    expect(res.body.message).toMatch(/[؀-ۿ]/);
  });

  it("rejects an invalid body with field errors", async () => {
    const res = await request(t.http)
      .post("/v1/inquiries")
      .send({ name: "ه", mobile: "0912", carpetSlugs: [] })
      .expect(400);
    const paths = (res.body.details as { path: string }[]).map((d) => d.path).sort();
    expect(paths).toEqual(["carpetSlugs", "mobile", "name"]);
  });
});

describe("admin inquiries", () => {
  it("is forbidden for a user and unauthenticated for a visitor", async () => {
    await request(t.http).get("/v1/inquiries").expect(401);
    await request(t.http).get("/v1/inquiries").set("Cookie", user.cookie).expect(403);
  });

  it("lists newest first with masked mobiles and filters by status", async () => {
    const res = await request(t.http).get("/v1/inquiries").set("Cookie", admin.cookie).expect(200);
    expect(res.body.meta.totalItems).toBe(2);
    expect(res.body.data[0].mobile).toBe("0912***6789");
    const [newest, older] = res.body.data as { createdAt: string }[];
    expect(newest!.createdAt >= older!.createdAt).toBe(true);

    const id = (res.body.data[0] as { id: string }).id;
    const detail = await request(t.http)
      .get(`/v1/inquiries/${id}`)
      .set("Cookie", admin.cookie)
      .expect(200);
    expect(detail.body.data.mobile).toBe("09123456789");

    const patched = await request(t.http)
      .patch(`/v1/inquiries/${id}/status`)
      .set("Cookie", admin.cookie)
      .send({ status: "contacted" })
      .expect(200);
    expect(patched.body.data.status).toBe("contacted");

    const contacted = await request(t.http)
      .get("/v1/inquiries?status=contacted")
      .set("Cookie", admin.cookie)
      .expect(200);
    expect(contacted.body.data).toHaveLength(1);

    await request(t.http)
      .patch(`/v1/inquiries/${id}/status`)
      .set("Cookie", admin.cookie)
      .send({ status: "archived" })
      .expect(400);
    await request(t.http)
      .patch("/v1/inquiries/not-an-id/status")
      .set("Cookie", admin.cookie)
      .send({ status: "closed" })
      .expect(404);
  });
});
