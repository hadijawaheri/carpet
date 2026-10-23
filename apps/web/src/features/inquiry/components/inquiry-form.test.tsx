// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw";
import { renderWithProviders } from "@/test/render";

import { InquiryForm } from "./inquiry-form";

describe("InquiryForm", () => {
  it("cannot be sent without a carpet in the selection", () => {
    renderWithProviders(<InquiryForm carpetSlugs={[]} onSent={vi.fn()} />);
    expect(screen.getByRole("button", { name: "ثبت درخواست استعلام" })).toBeDisabled();
  });

  it("marks each invalid field with its Persian message", async () => {
    renderWithProviders(<InquiryForm carpetSlugs={["kashan-red"]} onSent={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "ثبت درخواست استعلام" }));

    expect(await screen.findByText("نام را کامل بنویسید")).toBeInTheDocument();
    expect(screen.getByText("شماره موبایل معتبر نیست")).toBeInTheDocument();
    expect(screen.getByLabelText("نام")).toHaveAttribute("aria-invalid", "true");
  });

  it("posts the selection without an empty message and shows the confirmation", async () => {
    let body: unknown = null;
    server.use(
      http.post("*/api/inquiries", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: {} }, { status: 201 });
      }),
    );
    const onSent = vi.fn();
    renderWithProviders(<InquiryForm carpetSlugs={["kashan-red"]} onSent={onSent} />);

    await userEvent.type(screen.getByLabelText("نام"), "هادی جواهری");
    await userEvent.type(screen.getByLabelText("شماره موبایل"), "09123456789");
    await userEvent.click(screen.getByRole("button", { name: "ثبت درخواست استعلام" }));

    expect(await screen.findByText("درخواست شما ثبت شد")).toBeInTheDocument();
    await waitFor(() => expect(onSent).toHaveBeenCalled());
    expect(body).toEqual({
      name: "هادی جواهری",
      mobile: "09123456789",
      carpetSlugs: ["kashan-red"],
    });
  });

  it("puts the API's field errors next to the field", async () => {
    server.use(
      http.post("*/api/inquiries", () =>
        HttpResponse.json(
          {
            statusCode: 400,
            code: "VALIDATION_FAILED",
            message: "درخواست معتبر نیست",
            details: [{ path: "mobile", message: "این شماره پذیرفته نیست" }],
          },
          { status: 400 },
        ),
      ),
    );
    renderWithProviders(<InquiryForm carpetSlugs={["kashan-red"]} onSent={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("نام"), "هادی جواهری");
    await userEvent.type(screen.getByLabelText("شماره موبایل"), "09123456789");
    await userEvent.click(screen.getByRole("button", { name: "ثبت درخواست استعلام" }));

    expect(await screen.findByText("این شماره پذیرفته نیست")).toBeInTheDocument();
  });

  it("shows a general server error inside the form", async () => {
    server.use(
      http.post("*/api/inquiries", () =>
        HttpResponse.json(
          { statusCode: 429, code: "RATE_LIMITED", message: "کمی بعد دوباره تلاش کنید" },
          { status: 429 },
        ),
      ),
    );
    renderWithProviders(<InquiryForm carpetSlugs={["kashan-red"]} onSent={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("نام"), "هادی جواهری");
    await userEvent.type(screen.getByLabelText("شماره موبایل"), "09123456789");
    await userEvent.click(screen.getByRole("button", { name: "ثبت درخواست استعلام" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("کمی بعد دوباره تلاش کنید");
  });
});
