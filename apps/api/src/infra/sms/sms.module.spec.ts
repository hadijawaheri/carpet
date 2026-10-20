import { describe, expect, it, vi } from "vitest";

import { AppException } from "../../common/app-exception.js";
import { ConsoleSmsProvider } from "./console-sms.provider.js";
import { MelipayamakSmsProvider } from "./melipayamak-sms.provider.js";
import { createSmsProvider } from "./sms.module.js";

describe("createSmsProvider", () => {
  it("returns the console provider in development", () => {
    expect(createSmsProvider({ SMS_PROVIDER: "console" })).toBeInstanceOf(ConsoleSmsProvider);
  });

  it("returns Melipayamak when its key and pattern are set", () => {
    const provider = createSmsProvider({
      SMS_PROVIDER: "melipayamak",
      MELIPAYAMAK_API_KEY: "key-12345678",
      MELIPAYAMAK_BODY_ID: 42,
    });
    expect(provider).toBeInstanceOf(MelipayamakSmsProvider);
  });

  it("refuses Melipayamak without credentials", () => {
    expect(() => createSmsProvider({ SMS_PROVIDER: "melipayamak" })).toThrow(/MELIPAYAMAK/);
  });
});

describe("MelipayamakSmsProvider", () => {
  const config = { apiKey: "key-12345678", bodyId: 42 };

  it("sends the code as the pattern's only argument", async () => {
    const fetchMock = vi.fn<typeof fetch>(() =>
      Promise.resolve(Response.json({ recId: 4_003_920_112, status: "ارسال موفق بود" })),
    );
    await new MelipayamakSmsProvider(config, fetchMock).sendOtp("09121234567", "654321");

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://console.melipayamak.com/api/send/shared/key-12345678");
    expect(JSON.parse(String(init?.body))).toEqual({
      bodyId: 42,
      to: "09121234567",
      args: ["654321"],
    });
  });

  it("throws a 503 when Melipayamak reports an error number", async () => {
    const fetchMock = vi.fn<typeof fetch>(() =>
      Promise.resolve(Response.json({ recId: 11, status: "اعتبار کافی نیست" })),
    );
    const sending = new MelipayamakSmsProvider(config, fetchMock).sendOtp("09121234567", "654321");
    await expect(sending).rejects.toBeInstanceOf(AppException);
    await expect(sending).rejects.toMatchObject({ code: "SMS_UNAVAILABLE" });
  });

  it("throws a 503 when the network fails", async () => {
    const fetchMock = vi.fn<typeof fetch>(() => Promise.reject(new TypeError("fetch failed")));
    await expect(
      new MelipayamakSmsProvider(config, fetchMock).sendOtp("09121234567", "654321"),
    ).rejects.toMatchObject({ code: "SMS_UNAVAILABLE" });
  });
});
