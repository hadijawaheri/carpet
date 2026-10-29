import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { UPLOADED_IMAGE_PATH } from "@farsh/contracts";
import sharp from "sharp";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Session, TestApp } from "./test-app.js";
import { createTestApp, signInAs } from "./test-app.js";

let t: TestApp;
let admin: Session;
let user: Session;
let mediaDir: string;

const jpeg = (width: number, height: number, background = "#7a2e2a"): Promise<Buffer> =>
  sharp({ create: { width, height, channels: 3, background } })
    .jpeg()
    .toBuffer();

const stored = async (): Promise<string[]> =>
  (await readdir(path.join(mediaDir, "carpets")).catch(() => [])).sort();

const fileOf = (image: string): string => image.slice(UPLOADED_IMAGE_PATH.length);

async function upload(photo: Buffer): Promise<{ image: string; imageAspect: number }> {
  const res = await request(t.http)
    .post("/v1/media/carpets")
    .set("Cookie", admin.cookie)
    .attach("image", photo, "photo.jpg")
    .expect(201);
  return res.body.data as { image: string; imageAspect: number };
}

const carpet = (slug: string, photo: { image: string; imageAspect: number }) => ({
  slug,
  name: "فرش آزمایشی",
  material: "wool",
  widthCm: 120,
  lengthCm: 180,
  ...photo,
});

beforeAll(async () => {
  mediaDir = await mkdtemp(path.join(tmpdir(), "farsh-media-"));
  t = await createTestApp({ MEDIA_DIR: mediaDir });
  admin = await signInAs(t, "09121111111", "admin");
  user = await signInAs(t, "09122222222", "user");
});

afterAll(async () => {
  await t.close();
  await rm(mediaDir, { recursive: true, force: true });
});

describe("photo upload", () => {
  it("needs a session (401) and the admin role (403)", async () => {
    const photo = await jpeg(60, 90);
    await request(t.http).post("/v1/media/carpets").attach("image", photo, "photo.jpg").expect(401);
    await request(t.http)
      .post("/v1/media/carpets")
      .set("Cookie", user.cookie)
      .attach("image", photo, "photo.jpg")
      .expect(403);
    expect(await stored()).toEqual([]);
  });

  it("stores a WebP and serves it for a year", async () => {
    const photo = await upload(await jpeg(600, 900));
    expect(photo.image.startsWith(UPLOADED_IMAGE_PATH)).toBe(true);
    expect(photo.imageAspect).toBe(0.6667);
    expect(await stored()).toContain(fileOf(photo.image));

    const served = await request(t.http)
      .get(`/v1/media/carpets/${fileOf(photo.image)}`)
      .expect(200);
    expect(served.headers["content-type"]).toBe("image/webp");
    expect(served.headers["cache-control"]).toBe("public, max-age=31536000, immutable");
  });

  it("rejects a non-image whatever its name, an empty form, and a file over 15 MB", async () => {
    const before = await stored();
    const fake = await request(t.http)
      .post("/v1/media/carpets")
      .set("Cookie", admin.cookie)
      .attach("image", Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"), {
        filename: "photo.jpg",
        contentType: "image/jpeg",
      })
      .expect(415);
    expect(fake.body).toMatchObject({ code: "VALIDATION_FAILED" });

    const empty = await request(t.http)
      .post("/v1/media/carpets")
      .set("Cookie", admin.cookie)
      .set("Content-Type", "multipart/form-data; boundary=farsh")
      .send("--farsh--\r\n")
      .expect(400);
    expect(empty.body).toMatchObject({
      code: "VALIDATION_FAILED",
      message: "عکسی انتخاب نشده است",
    });

    const huge = await request(t.http)
      .post("/v1/media/carpets")
      .set("Cookie", admin.cookie)
      .attach("image", Buffer.alloc(15 * 1024 * 1024 + 1, 0xff), "huge.jpg")
      .expect(413);
    expect(huge.body).toMatchObject({
      code: "VALIDATION_FAILED",
      message: "حجم درخواست بیش از حد مجاز است",
    });
    expect(await stored()).toEqual(before);
  });

  it("serves only names the API writes", async () => {
    await request(t.http).get("/v1/media/carpets/..%2F..%2Fpackage.json").expect(404);
    await request(t.http).get("/v1/media/carpets/0123456789abcdef01234567.webp").expect(404);
  });
});

describe("carpets with uploaded photos", () => {
  it("accepts only uploads that are on disk", async () => {
    const res = await request(t.http)
      .post("/v1/carpets")
      .set("Cookie", admin.cookie)
      .send(
        carpet("missing-photo", {
          image: `${UPLOADED_IMAGE_PATH}0123456789abcdef01234567.webp`,
          imageAspect: 1,
        }),
      )
      .expect(400);
    expect(res.body).toMatchObject({ code: "VALIDATION_FAILED" });
    expect(res.body.details).toEqual([
      { path: "image", message: "این عکس روی سرور نیست؛ دوباره بارگذاری کنید" },
    ]);
  });

  it("deletes a replaced photo once no carpet uses it", async () => {
    const first = await upload(await jpeg(600, 900, "#112233"));
    await request(t.http)
      .post("/v1/carpets")
      .set("Cookie", admin.cookie)
      .send(carpet("uploaded-a", first))
      .expect(201);
    await request(t.http)
      .post("/v1/carpets")
      .set("Cookie", admin.cookie)
      .send(carpet("uploaded-b", first))
      .expect(201);

    // Still used by uploaded-b, so it stays
    const second = await upload(await jpeg(900, 600, "#445566"));
    const updated = await request(t.http)
      .patch("/v1/carpets/uploaded-a")
      .set("Cookie", admin.cookie)
      .send(second)
      .expect(200);
    expect(updated.body.data).toMatchObject(second);
    expect(await stored()).toContain(fileOf(first.image));

    // Its last user moves to a photo from the web app's public folder, so it goes
    await request(t.http)
      .patch("/v1/carpets/uploaded-b")
      .set("Cookie", admin.cookie)
      .send({ image: "/carpets/kashan-red.jpg", imageAspect: 0.6 })
      .expect(200);
    const files = await stored();
    expect(files).not.toContain(fileOf(first.image));
    expect(files).toContain(fileOf(second.image));
    await request(t.http)
      .get(`/v1/media/carpets/${fileOf(first.image)}`)
      .expect(404);

    const fetched = await request(t.http).get("/v1/carpets/uploaded-a").expect(200);
    expect(fetched.body.data).toMatchObject(second);
  });
});
