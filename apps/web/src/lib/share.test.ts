import { describe, expect, it } from "vitest";

import { shareLinks } from "./share";

describe("shareLinks", () => {
  const url = "https://farsh.example/carpets/kashan-red";

  it("puts the text and the link in WhatsApp's single text field", () => {
    const link = new URL(shareLinks(url, "فرش کاشان سرخ").whatsapp);
    expect(link.origin).toBe("https://wa.me");
    expect(link.searchParams.get("text")).toBe(`فرش کاشان سرخ\n${url}`);
  });

  it("gives Telegram the link and the text separately", () => {
    const link = new URL(shareLinks(url, "فرش کاشان سرخ").telegram);
    expect(link.origin + link.pathname).toBe("https://t.me/share/url");
    expect(link.searchParams.get("url")).toBe(url);
    expect(link.searchParams.get("text")).toBe("فرش کاشان سرخ");
  });

  it("encodes characters that would break the query string", () => {
    const link = new URL(shareLinks("https://farsh.example/?a=1&b=2", "x & y").telegram);
    expect(link.searchParams.get("url")).toBe("https://farsh.example/?a=1&b=2");
    expect(link.searchParams.get("text")).toBe("x & y");
  });
});
