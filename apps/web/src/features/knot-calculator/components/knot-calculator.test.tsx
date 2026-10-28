// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { formatNumber } from "@/lib/format";
import { renderWithProviders } from "@/test/render";

import { KnotCalculator } from "./knot-calculator";

const result = (term: string) => screen.getByText(term).nextElementSibling?.textContent;

describe("KnotCalculator", () => {
  it("starts from a 50 raj, 200 × 300 carpet", () => {
    renderWithProviders(<KnotCalculator />);
    expect(result("گره در هر متر مربع")).toBe(`حدود ${formatNumber(510_204)}`);
    expect(result("کل گره‌های فرش")).toBe(`حدود ${formatNumber(3_061_224)}`);
    expect(result("فاصله‌ی دو گره در عرض")).toBe("۱٫۴ میلی‌متر");
  });

  it("recalculates as the raj is typed in Persian digits", async () => {
    renderWithProviders(<KnotCalculator />);
    const raj = screen.getByLabelText("رج");
    await userEvent.clear(raj);
    await userEvent.type(raj, "۷۰");
    expect(result("گره در هر متر مربع")).toBe(`حدود ${formatNumber(1_000_000)}`);
    expect(result("گره در هر اینچ مربع")).toBe(`حدود ${formatNumber(645)}`);
    expect(result("کل گره‌های فرش")).toBe(`حدود ${formatNumber(6_000_000)}`);
  });

  it("marks an impossible raj and drops the results that depend on it", async () => {
    renderWithProviders(<KnotCalculator />);
    const raj = screen.getByLabelText("رج");
    await userEvent.clear(raj);
    await userEvent.type(raj, "500");
    expect(raj).toHaveAttribute("aria-invalid", "true");
    expect(raj).toHaveAccessibleDescription(/عددی بین ۱۰ و ۱۵۰ بنویسید/);
    expect(screen.queryByText("گره در هر متر مربع")).not.toBeInTheDocument();
    expect(screen.getByText(/رج را درست وارد کنید/)).toBeInTheDocument();
  });

  it("keeps the per-m² results when only the size is wrong", async () => {
    renderWithProviders(<KnotCalculator />);
    await userEvent.clear(screen.getByLabelText("عرض فرش (سانتی‌متر)"));
    expect(result("گره در هر متر مربع")).toBe(`حدود ${formatNumber(510_204)}`);
    expect(screen.queryByText("کل گره‌های فرش")).not.toBeInTheDocument();
  });

  it("counts machine-made points exactly and does not call them knots", async () => {
    renderWithProviders(<KnotCalculator />);
    await userEvent.click(screen.getByRole("radio", { name: "ماشینی، با شانه و تراکم" }));
    expect(screen.getByLabelText("شانه")).toHaveValue("1200");
    expect(result("نقطه‌ی پرز در هر متر مربع")).toBe(formatNumber(4_320_000));
    expect(result("کل نقطه‌های پرز فرش")).toBe(formatNumber(25_920_000));
    expect(screen.queryByText("فاصله‌ی دو گره در عرض")).not.toBeInTheDocument();
  });
});
