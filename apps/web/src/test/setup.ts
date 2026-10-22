import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./msw";

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
  // The app calls same-origin paths (/api/...); Node's fetch needs an absolute URL. Installed after
  // MSW's patch so MSW sees the resolved URL.
  if (typeof window !== "undefined") {
    const fetchWithMsw = globalThis.fetch;
    globalThis.fetch = (input, init) =>
      fetchWithMsw(
        typeof input === "string" && input.startsWith("/")
          ? new URL(input, window.location.origin)
          : input,
        init,
      );
  }
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
