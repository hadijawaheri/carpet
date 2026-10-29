import { expect, openPage, test } from "./fixtures";

test.describe("see the carpet in my room", () => {
  test("serves a glTF model at the carpet's size, cached under its version", async ({
    request,
  }) => {
    const first = await request.get("/carpets/kashan-red/model.glb", { maxRedirects: 0 });
    expect(first.status()).toBe(307);
    expect(first.headers()["cache-control"]).toBe("no-store");
    const location = first.headers()["location"]!;
    expect(location).toMatch(/\/carpets\/kashan-red\/model\.glb\?v=[0-9a-f]{8}$/);

    const model = await request.get(location);
    expect(model.status()).toBe(200);
    expect(model.headers()["content-type"]).toBe("model/gltf-binary");
    expect(model.headers()["cache-control"]).toContain("immutable");
    const glb = await model.body();
    expect(glb.subarray(0, 4).toString("latin1")).toBe("glTF");
    expect(glb.readUInt32LE(8)).toBe(glb.byteLength);
    const json = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString("utf8")) as {
      accessors: { max?: number[] }[];
    };
    // 200 × 345 cm in the catalogue, metres in the model
    expect(json.accessors[0]!.max).toEqual([1, 0, 1.725]);
  });

  test("serves a USDZ for Quick Look and nothing for an unknown carpet", async ({ request }) => {
    const usdz = await request.get("/carpets/kashan-red/model.usdz");
    expect(usdz.status()).toBe(200);
    expect(usdz.headers()["content-type"]).toBe("model/vnd.usdz+zip");
    const zip = await usdz.body();
    expect(zip.subarray(0, 4).toString("latin1")).toBe("PK\u0003\u0004");
    expect(zip.subarray(30, 41).toString("latin1")).toBe("carpet.usda");

    expect((await request.get("/carpets/no-such-carpet/model.glb")).status()).toBe(404);
  });

  test("offers the phone's AR viewer, or a QR code on a computer", async ({
    page,
    consoleProblems,
  }, testInfo) => {
    await openPage(page, "/carpets/kashan-red");
    if (testInfo.project.name === "mobile") {
      // Pixel 7: Android hands the model to Scene Viewer at a fixed, real scale
      const link = page.getByRole("link", { name: "در اتاق خودم ببینم" });
      const href = (await link.getAttribute("href"))!;
      expect(href).toMatch(/^intent:\/\/arvr\.google\.com\/scene-viewer\/1\.2\?/);
      const params = new URLSearchParams(href.slice(href.indexOf("?") + 1, href.indexOf("#")));
      expect(params.get("file")).toMatch(/\/carpets\/kashan-red\/model\.glb\?v=[0-9a-f]{8}$/);
      expect(params.get("resizable")).toBe("false");
      expect(href).toContain("package=com.google.ar.core");
    } else {
      const button = page.getByRole("button", { name: "در اتاق خودم ببینم" });
      await expect(button).toHaveAttribute("aria-expanded", "false");
      await button.click();
      await expect(button).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByRole("img", { name: "کد QR این صفحه" })).toBeVisible();
    }
    expect(consoleProblems).toEqual([]);
  });
});
