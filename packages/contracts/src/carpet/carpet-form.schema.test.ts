import { describe, expect, it } from "vitest";

import type { Carpet } from "./carpet.schema";
import { updateCarpetSchema } from "./carpet-admin.schema";
import { carpetCatalog } from "./carpet-catalog";
import type { CarpetFormInput } from "./carpet-form.schema";
import {
  carpetFormSchema,
  emptyCarpetForm,
  toCarpetFields,
  toCarpetForm,
} from "./carpet-form.schema";

const filled: CarpetFormInput = {
  ...emptyCarpetForm,
  name: " کاشان سرخ ",
  slug: "kashan-red-2",
  widthCm: "۲۰۰",
  lengthCm: "300",
  densityUnit: "raj",
  densityValue: "۵۰",
  priceToman: "۱٬۲۰۰٬۰۰۰",
  origin: "کاشان",
  wovenYear: "۱۳۹۸",
};

const issues = (input: CarpetFormInput) => {
  const result = carpetFormSchema.safeParse(input);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]));
};

describe("carpetFormSchema", () => {
  it("reads Persian digits and separators and turns tomans into rials", () => {
    const fields = toCarpetFields(carpetFormSchema.parse(filled));
    expect(fields).toEqual({
      name: "کاشان سرخ",
      material: "wool",
      widthCm: 200,
      lengthCm: 300,
      density: { unit: "raj", value: 50 },
      priceRial: 12_000_000,
      provenance: { origin: "کاشان", wovenYear: 1398 },
      isPlaceholder: false,
    });
    // What the form sends is exactly what the API accepts
    expect(updateCarpetSchema.parse(fields)).toEqual(fields);
  });

  it("sends null for empty optional fields, so saving clears them", () => {
    const fields = toCarpetFields(
      carpetFormSchema.parse({
        ...filled,
        densityUnit: "none",
        priceToman: "",
        origin: "",
        wovenYear: "",
      }),
    );
    expect(fields).toMatchObject({ density: null, priceRial: null, provenance: null });
    expect(updateCarpetSchema.parse(fields)).toEqual(fields);
  });

  it("keeps the takham only for machine-made density", () => {
    const fields = toCarpetFields(
      carpetFormSchema.parse({
        ...filled,
        densityUnit: "shaneh",
        densityValue: "1200",
        takham: "۳۶۰۰",
      }),
    );
    expect(fields.density).toEqual({ unit: "shaneh", value: 1200, takham: 3600 });
  });

  it("explains each mistake in Persian next to its field", () => {
    expect(
      issues({
        ...filled,
        name: " ",
        slug: "کاشان",
        widthCm: "",
        lengthCm: "12.5",
        wovenYear: "2019",
      }),
    ).toEqual({
      name: "نام فرش را بنویسید",
      slug: "فقط حروف کوچک انگلیسی، عدد و خط تیره",
      widthCm: "یک عدد بنویسید",
      lengthCm: "فقط عدد صحیح بنویسید",
      wovenYear: "حداکثر ۱٬۵۰۰",
    });
  });

  it("ignores density fields the chosen unit hides", () => {
    expect(issues({ ...filled, densityUnit: "none", densityValue: "12.5" })).toEqual({});
    expect(issues({ ...filled, densityUnit: "raj", takham: "abc" })).toEqual({});
    expect(
      issues({ ...filled, densityUnit: "shaneh", densityValue: "1200", takham: "abc" }),
    ).toEqual({
      takham: "فقط عدد صحیح بنویسید",
    });
  });

  it("keeps an untouched price's exact rials", () => {
    const original = { ...carpetCatalog[0]!, priceRial: 12_345 };
    const form = carpetFormSchema.parse(toCarpetForm(original));
    expect(toCarpetFields(form, original).priceRial).toBe(12_345);
    const changed = carpetFormSchema.parse({ ...toCarpetForm(original), priceToman: "2000" });
    expect(toCarpetFields(changed, original).priceRial).toBe(20_000);
  });

  it("asks for the density once a unit is picked", () => {
    expect(issues({ ...filled, densityValue: "" })).toEqual({ densityValue: "تراکم را بنویسید" });
  });
});

describe("toCarpetForm", () => {
  it("round-trips every catalogue carpet", () => {
    for (const carpet of carpetCatalog) {
      const fields = toCarpetFields(carpetFormSchema.parse(toCarpetForm(carpet)));
      expect(fields).toEqual({
        name: carpet.name,
        material: carpet.material,
        widthCm: carpet.widthCm,
        lengthCm: carpet.lengthCm,
        density: carpet.density ?? null,
        priceRial: carpet.priceRial ?? null,
        provenance: carpet.provenance ?? null,
        isPlaceholder: carpet.isPlaceholder,
      });
    }
  });

  it("shows a shaneh carpet's takham and its price in tomans", () => {
    const carpet: Carpet = {
      ...carpetCatalog[0]!,
      density: { unit: "shaneh", value: 1200, takham: 3600 },
      priceRial: 45_000_000,
    };
    expect(toCarpetForm(carpet)).toMatchObject({
      densityUnit: "shaneh",
      densityValue: "1200",
      takham: "3600",
      priceToman: "4500000",
    });
  });
});
