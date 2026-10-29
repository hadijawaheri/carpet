import { z } from "zod";

import { normalizeDigits } from "../common/digits";
import type { Carpet, KnotDensity, Provenance } from "./carpet.schema";
import { carpetSlugSchema, pileMaterialSchema } from "./carpet.schema";
import type { UpdateCarpetInput } from "./carpet-admin.schema";

// One toman is ten rials; the trade quotes tomans, the API stores rials
const RIAL_PER_TOMAN = 10;

const fa = new Intl.NumberFormat("fa-IR", { useGrouping: true });

const toDigits = (value: string) => normalizeDigits(value).trim().replace(/[,٬،]/g, "");

/** A whole number typed in any digits, within a range a carpet can really have. */
const count = (min: number, max: number) =>
  z
    .string()
    .transform(toDigits)
    .pipe(
      z
        .string()
        .min(1, "یک عدد بنویسید")
        .regex(/^\d*$/, "فقط عدد صحیح بنویسید")
        .transform(Number)
        .pipe(
          z
            .number()
            .min(min, `دست‌کم ${fa.format(min)}`)
            .max(max, `حداکثر ${fa.format(max)}`),
        ),
    );

/** The same, but an empty field means "not known". */
const optionalCount = (min: number, max: number) =>
  z.string().transform((value, ctx) => {
    if (toDigits(value) === "") return undefined;
    const parsed = count(min, max).safeParse(value);
    if (parsed.success) return parsed.data;
    for (const issue of parsed.error.issues)
      ctx.addIssue({ code: "custom", message: issue.message });
    return z.NEVER;
  });

const optionalText = z
  .string()
  .trim()
  .max(80, "حداکثر ۸۰ نویسه")
  .transform((value) => value || undefined);

/**
 * The admin form's fields: text as typed (Persian digits included), turned into the API's shapes on
 * submit by `toCarpetFields`. Photo fields are handled by the upload, not typed.
 */
export const carpetFormSchema = z
  .object({
    name: z.string().trim().min(1, "نام فرش را بنویسید").max(80, "حداکثر ۸۰ نویسه"),
    slug: z.string().trim().pipe(carpetSlugSchema),
    material: pileMaterialSchema,
    widthCm: count(30, 2000),
    lengthCm: count(30, 3000),
    densityUnit: z.enum(["none", "raj", "shaneh"]),
    densityValue: optionalCount(1, 5000),
    takham: optionalCount(1, 10000),
    priceToman: optionalCount(1, 100_000_000_000),
    origin: optionalText,
    workshop: optionalText,
    weaver: optionalText,
    wovenYear: optionalCount(1200, 1500),
    isPlaceholder: z.boolean(),
  })
  .superRefine((form, ctx) => {
    if (form.densityUnit !== "none" && form.densityValue === undefined) {
      ctx.addIssue({ code: "custom", path: ["densityValue"], message: "تراکم را بنویسید" });
    }
  });
export type CarpetFormInput = z.input<typeof carpetFormSchema>;
export type CarpetFormValues = z.output<typeof carpetFormSchema>;

function densityOf(form: CarpetFormValues): KnotDensity | null {
  if (form.densityUnit === "none" || form.densityValue === undefined) return null;
  if (form.densityUnit === "raj") return { unit: "raj", value: form.densityValue };
  return {
    unit: "shaneh",
    value: form.densityValue,
    ...(form.takham === undefined ? {} : { takham: form.takham }),
  };
}

function provenanceOf(form: CarpetFormValues): Provenance | null {
  const provenance: Provenance = {
    ...(form.origin ? { origin: form.origin } : {}),
    ...(form.workshop ? { workshop: form.workshop } : {}),
    ...(form.weaver ? { weaver: form.weaver } : {}),
    ...(form.wovenYear ? { wovenYear: form.wovenYear } : {}),
  };
  return Object.keys(provenance).length > 0 ? provenance : null;
}

/** Every field the form owns, with null for the ones left empty, so saving clears them on the API too. */
export function toCarpetFields(
  form: CarpetFormValues,
): Required<Omit<UpdateCarpetInput, "image" | "imageAspect">> {
  return {
    name: form.name,
    material: form.material,
    widthCm: form.widthCm,
    lengthCm: form.lengthCm,
    density: densityOf(form),
    priceRial: form.priceToman === undefined ? null : form.priceToman * RIAL_PER_TOMAN,
    provenance: provenanceOf(form),
    isPlaceholder: form.isPlaceholder,
  };
}

const text = (n: number | undefined) => (n === undefined ? "" : String(n));

/** A carpet as the form shows it; a new carpet starts from `emptyCarpetForm`. */
export function toCarpetForm(carpet: Carpet): CarpetFormInput {
  return {
    name: carpet.name,
    slug: carpet.slug,
    material: carpet.material,
    widthCm: String(carpet.widthCm),
    lengthCm: String(carpet.lengthCm),
    densityUnit: carpet.density?.unit ?? "none",
    densityValue: text(carpet.density?.value),
    takham: text(carpet.density?.unit === "shaneh" ? carpet.density.takham : undefined),
    // A rial price that is not a whole toman is shown rounded down rather than as a fraction
    priceToman: text(
      carpet.priceRial === undefined ? undefined : Math.floor(carpet.priceRial / RIAL_PER_TOMAN),
    ),
    origin: carpet.provenance?.origin ?? "",
    workshop: carpet.provenance?.workshop ?? "",
    weaver: carpet.provenance?.weaver ?? "",
    wovenYear: text(carpet.provenance?.wovenYear),
    isPlaceholder: carpet.isPlaceholder,
  };
}

export const emptyCarpetForm: CarpetFormInput = {
  name: "",
  slug: "",
  material: "wool",
  widthCm: "",
  lengthCm: "",
  densityUnit: "none",
  densityValue: "",
  takham: "",
  priceToman: "",
  origin: "",
  workshop: "",
  weaver: "",
  wovenYear: "",
  isPlaceholder: false,
};
