import { carpetCatalog } from "@farsh/contracts";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw";

import { getCarpet } from "./get-carpets";

const api = "http://localhost:7781/v1/carpets";
const kashan = carpetCatalog.find((c) => c.slug === "kashan-red")!;

describe("getCarpet", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns the API's carpet", async () => {
    const edited = { ...kashan, name: "کاشان سرخ تازه" };
    server.use(http.get(`${api}/kashan-red`, () => HttpResponse.json({ data: edited })));
    await expect(getCarpet("kashan-red")).resolves.toEqual(edited);
  });

  it("trusts the API's 404, even for a slug the bundled catalogue still has", async () => {
    server.use(
      http.get(`${api}/kashan-red`, () =>
        HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 }),
      ),
    );
    await expect(getCarpet("kashan-red")).resolves.toBeNull();
  });

  it("falls back to the bundled catalogue when the API fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    server.use(http.get(`${api}/kashan-red`, () => HttpResponse.error()));
    await expect(getCarpet("kashan-red")).resolves.toEqual(kashan);
  });

  it("falls back to the bundled catalogue when the API answers with an unexpected shape", async () => {
    server.use(http.get(`${api}/kashan-red`, () => HttpResponse.json({ data: { slug: 1 } })));
    await expect(getCarpet("kashan-red")).resolves.toEqual(kashan);
  });

  it("returns null for an unknown slug when the API is down", async () => {
    server.use(http.get(`${api}/no-such-carpet`, () => new HttpResponse(null, { status: 503 })));
    await expect(getCarpet("no-such-carpet")).resolves.toBeNull();
  });

  it("never sends a non-slug to the API", async () => {
    const request = vi.fn();
    server.use(http.get(`${api}/*`, request));
    await expect(getCarpet("../auth/me")).resolves.toBeNull();
    await expect(getCarpet("KASHAN")).resolves.toBeNull();
    expect(request).not.toHaveBeenCalled();
  });
});
