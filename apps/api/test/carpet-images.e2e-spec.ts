import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { carpetCatalog, UPLOADED_IMAGE_PATH } from "@farsh/contracts";
import sharp from "sharp";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { CarpetsService } from "../src/modules/carpets/carpets.service.js";
import type { Session, TestApp } from "./test-app.js";
import { createTestApp, signInAs } from "./test-app.js";

let t: TestApp;
let admin: Session;
let user: Session;
let mediaDir: string;

const jpeg = (width: number, height: number): Promise<Buffer> =>
  sharp({ create: { width, height, channels: 3, background: "#7a2e2a" } })
    .jpeg()
    .toBuffer();

const stored = async (): Promise<string[]> =>
  (await readdir(path.join(mediaDir, "carpets")).catch(() => [])).sort();

beforeAll(async () => {
  mediaDir = await mkdtemp(path.join(tmpdir(), "farsh-media-"));
  t = await createTestApp({ MEDIA_DIR: mediaDir });
  await t.app.get(CarpetsService).upsertMany(carpetCatalog, false);
  admin = await signInAs(t, "09121111111", "admin");
  user = await signInAs(t, "09122222222", "user");
});

afterAll(async () => {
  await t.close();
  await rm(mediaDir, { recursive: true, force: true });
});

describe("carpet photo upload", () => {
  it("needs a session (401) and the admin role (403)", async () => {
    const photo = await jpeg(60, 90);
    await request(t.http)
      .post("/v1/carpets/kashan-red/image")
      .attach("image", photo, "photo.jpg")
      .expect(401);
    await request(t.http)
      .post("/v1/carpets/kashan-red/image")
      .set("Cookie", user.cookie)
      .attach("image", photo, "photo.jpg")
      .expect(403);
    expect(await stored()).toEqual([]);
  });

  it("stores a WebP, updates the carpet, serves it, and replaces it on the next upload", async () => {
    const first = await request(t.http)
      .post("/v1/carpets/kashan-red/image")
      .set("Cookie", admin.cookie)
      .attach("image", await jpeg(600, 900), "photo.jpg")
      .expect(201);
    const carpet = first.body.data as { image: string; imageAspect: number };
    expect(carpet.image.startsWith(`${UPLOADED_IMAGE_PATH}kashan-red-`)).toBe(true);
    expect(carpet.imageAspect).toBe(0.6667);
    const fetched = await request(t.http).get("/v1/carpets/kashan-red").expect(200);
    expect(fetched.body.data).toMatchObject(carpet);

    const file = carpet.image.slice(UPLOADED_IMAGE_PATH.length);
    expect(await stored()).toEqual([file]);
    const served = await request(t.http).get(`/v1/media/carpets/${file}`).expect(200);
    expect(served.headers["content-type"]).toBe("image/webp");
    expect(served.headers["cache-control"]).toBe("public, max-age=31536000, immutable");

    const second = await request(t.http)
      .post("/v1/carpets/kashan-red/image")
      .set("Cookie", admin.cookie)
      .attach("image", await jpeg(900, 600), "landscape.png")
      .expect(201);
    expect(second.body.data.imageAspect).toBe(1.5);
    expect(await stored()).toEqual([second.body.data.image.slice(UPLOADED_IMAGE_PATH.length)]);
    await request(t.http).get(`/v1/media/carpets/${file}`).expect(404);
  });

  it("rejects a non-image whatever its name, a missing file, and an unknown carpet", async () => {
    const before = await stored();
    const fake = await request(t.http)
      .post("/v1/carpets/kashan-red/image")
      .set("Cookie", admin.cookie)
      .attach("image", Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"), {
        filename: "photo.jpg",
        contentType: "image/jpeg",
      })
      .expect(415);
    expect(fake.body).toMatchObject({ code: "VALIDATION_FAILED" });

    const none = await request(t.http)
      .post("/v1/carpets/kashan-red/image")
      .set("Cookie", admin.cookie)
      .field("note", "no file")
      .expect(400);
    expect(none.body).toMatchObject({ code: "VALIDATION_FAILED" });

    await request(t.http)
      .post("/v1/carpets/nope/image")
      .set("Cookie", admin.cookie)
      .attach("image", await jpeg(60, 90), "photo.jpg")
      .expect(404);
    expect(await stored()).toEqual(before);
  });

  it("rejects a file over 15 MB with a Persian 413", async () => {
    const res = await request(t.http)
      .post("/v1/carpets/kashan-red/image")
      .set("Cookie", admin.cookie)
      .attach("image", Buffer.alloc(15 * 1024 * 1024 + 1, 0xff), "huge.jpg")
      .expect(413);
    expect(res.body).toMatchObject({
      code: "VALIDATION_FAILED",
      message: "حجم درخواست بیش از حد مجاز است",
    });
  });

  it("serves only names the API writes", async () => {
    await request(t.http).get("/v1/media/carpets/..%2F..%2Fpackage.json").expect(404);
    await request(t.http).get("/v1/media/carpets/kashan-red-0123456789ab.webp").expect(404);
  });
});
