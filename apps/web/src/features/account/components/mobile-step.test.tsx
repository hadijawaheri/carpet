// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw";
import { renderWithProviders } from "@/test/render";

import { MobileStep } from "./mobile-step";

describe("MobileStep", () => {
  it("shows the schema's message for a wrong number and sends nothing", async () => {
    const onSent = vi.fn();
    renderWithProviders(<MobileStep onSent={onSent} />);

    await userEvent.type(screen.getByLabelText("شماره موبایل"), "123");
    await userEvent.click(screen.getByRole("button", { name: "دریافت کد تأیید" }));

    expect(await screen.findByText("شماره موبایل معتبر نیست")).toBeInTheDocument();
    expect(screen.getByLabelText("شماره موبایل")).toHaveAttribute("aria-invalid", "true");
    expect(onSent).not.toHaveBeenCalled();
  });

  it("sends Persian digits as a normalised number", async () => {
    let body: unknown = null;
    server.use(
      http.post("*/api/auth/otp/request", async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const onSent = vi.fn();
    renderWithProviders(<MobileStep onSent={onSent} />);

    await userEvent.type(screen.getByLabelText("شماره موبایل"), "۰۹۱۲۳۴۵۶۷۸۹");
    await userEvent.click(screen.getByRole("button", { name: "دریافت کد تأیید" }));

    await waitFor(() => expect(onSent).toHaveBeenCalledWith("09123456789"));
    expect(body).toEqual({ mobile: "09123456789" });
  });

  it("toasts the API's Persian message when sending fails", async () => {
    server.use(
      http.post("*/api/auth/otp/request", () =>
        HttpResponse.json(
          { statusCode: 429, code: "RATE_LIMITED", message: "تعداد درخواست‌ها زیاد است" },
          { status: 429 },
        ),
      ),
    );
    renderWithProviders(<MobileStep onSent={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("شماره موبایل"), "09123456789");
    await userEvent.click(screen.getByRole("button", { name: "دریافت کد تأیید" }));

    expect(await screen.findByText("تعداد درخواست‌ها زیاد است")).toBeInTheDocument();
  });
});
