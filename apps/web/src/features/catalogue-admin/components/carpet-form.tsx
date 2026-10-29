"use client";

import {
  type Carpet,
  type CarpetFormInput,
  carpetFormSchema,
  type CarpetFormValues,
  emptyCarpetForm,
  toCarpetFields,
  toCarpetForm,
  type UploadedImage,
} from "@farsh/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, type Path, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { materialLabels } from "@/features/carpet-viewer";
import { ApiError } from "@/lib/api/parse";
import { showServerError } from "@/lib/form-errors";
import { paths } from "@/lib/paths";

import { refreshShowroom } from "../actions";
import { createCarpet, updateCarpet } from "../api";
import { PhotoField } from "./photo-field";

const PHOTO_REQUIRED = "عکس فرش را بارگذاری کنید";

const selectClass =
  "w-full border-b border-foreground/40 bg-transparent py-2 text-sm outline-none focus-visible:border-foreground aria-invalid:border-destructive";

interface TextFieldSpec {
  name: Path<CarpetFormInput>;
  label: string;
  description?: string;
  numeric?: boolean;
  dir?: "ltr";
}

const SERVER_FIELDS = [
  "name",
  "slug",
  "material",
  "widthCm",
  "lengthCm",
  "densityValue",
  "takham",
  "priceToman",
  "origin",
  "workshop",
  "weaver",
  "wovenYear",
] as const satisfies readonly Path<CarpetFormInput>[];

/** Creates a carpet when `carpet` is absent, otherwise edits it. */
export function CarpetForm({ carpet }: { carpet?: Carpet }) {
  const router = useRouter();
  const [photo, setPhoto] = useState<UploadedImage | null>(
    carpet ? { image: carpet.image, imageAspect: carpet.imageAspect } : null,
  );
  const [photoError, setPhotoError] = useState<string | undefined>();
  const form = useForm<CarpetFormInput, unknown, CarpetFormValues>({
    resolver: zodResolver(carpetFormSchema),
    defaultValues: carpet ? toCarpetForm(carpet) : emptyCarpetForm,
  });
  const densityUnit = useWatch({ control: form.control, name: "densityUnit" });

  const onSubmit = form.handleSubmit(
    async (values) => {
      if (!photo) {
        setPhotoError(PHOTO_REQUIRED);
        return;
      }
      const fields = toCarpetFields(values, carpet);
      try {
        if (carpet) {
          await updateCarpet(carpet.slug, { ...fields, ...photo });
        } else {
          const { density, priceRial, provenance, ...required } = fields;
          await createCarpet({
            ...required,
            ...photo,
            slug: values.slug,
            ...(density ? { density } : {}),
            ...(priceRial ? { priceRial } : {}),
            ...(provenance ? { provenance } : {}),
          });
        }
      } catch (e: unknown) {
        if (e instanceof ApiError && e.code === "CONFLICT") {
          form.setError("slug", { message: e.message });
          return;
        }
        if (e instanceof ApiError && isImageIssue(e.details)) {
          setPhoto(null);
          setPhotoError(e.message);
          return;
        }
        showServerError(e, form.setError, SERVER_FIELDS);
        return;
      }
      // Saved either way; a failed refresh only means the showroom catches up within a minute
      await refreshShowroom().catch(() => undefined);
      toast.success(carpet ? "تغییرات ذخیره شد" : "فرش به ویترین اضافه شد");
      if (carpet) router.refresh();
      else router.push(paths.catalogueCarpet(values.slug));
    },
    () => {
      if (!photo) setPhotoError(PHOTO_REQUIRED);
    },
  );

  const textField = ({ name, label, description, numeric, dir }: TextFieldSpec) => (
    <Controller
      key={name}
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`carpet-${name}`}>{label}</FieldLabel>
          <Input
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            onChange={field.onChange}
            value={typeof field.value === "string" ? field.value : ""}
            id={`carpet-${name}`}
            inputMode={numeric ? "numeric" : undefined}
            dir={dir}
            disabled={name === "slug" && Boolean(carpet)}
            aria-invalid={fieldState.invalid}
          />
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-10">
      <PhotoField
        value={photo}
        error={photoError}
        onChange={(next) => {
          setPhoto(next);
          setPhotoError(undefined);
        }}
      />

      <FieldSet>
        <FieldLegend>مشخصات</FieldLegend>
        <FieldGroup>
          {textField({ name: "name", label: "نام فرش" })}
          {textField({
            name: "slug",
            label: "شناسه در نشانی صفحه",
            description: carpet
              ? "شناسه‌ی فرش بعد از ساخت عوض نمی‌شود، تا پیوندهای اشتراک‌گذاشته کار کنند."
              : "حروف کوچک انگلیسی، عدد و خط تیره؛ مثل kashan-red",
            dir: "ltr",
          })}
          <Controller
            name="material"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="carpet-material">جنس پرز</FieldLabel>
                <select id="carpet-material" className={selectClass} {...field}>
                  {Object.entries(materialLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {textField({ name: "widthCm", label: "عرض (سانتی‌متر)", numeric: true })}
            {textField({ name: "lengthCm", label: "طول (سانتی‌متر)", numeric: true })}
          </div>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>تراکم</FieldLegend>
        <FieldGroup>
          <Controller
            name="densityUnit"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="carpet-densityUnit">واحد</FieldLabel>
                <select id="carpet-densityUnit" className={selectClass} {...field}>
                  <option value="none">ثبت نشده</option>
                  <option value="raj">رج (دستباف)</option>
                  <option value="shaneh">شانه و تراکم (ماشینی)</option>
                </select>
              </Field>
            )}
          />
          {densityUnit === "none" ? null : (
            <div className="grid gap-5 sm:grid-cols-2">
              {textField({
                name: "densityValue",
                label: densityUnit === "raj" ? "رج" : "شانه",
                numeric: true,
              })}
              {densityUnit === "shaneh"
                ? textField({ name: "takham", label: "تراکم (اختیاری)", numeric: true })
                : null}
            </div>
          )}
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>قیمت</FieldLegend>
        <FieldGroup>
          {textField({
            name: "priceToman",
            label: "قیمت (تومان)",
            description: "خالی یعنی «قیمت با تماس».",
            numeric: true,
          })}
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>شناسنامه</FieldLegend>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            {textField({ name: "origin", label: "محل بافت" })}
            {textField({ name: "workshop", label: "کارگاه" })}
            {textField({ name: "weaver", label: "بافنده" })}
            {textField({ name: "wovenYear", label: "سال بافت (شمسی)", numeric: true })}
          </div>
          <Controller
            name="isPlaceholder"
            control={form.control}
            render={({ field }) => (
              <Field orientation="horizontal">
                <input
                  id="carpet-isPlaceholder"
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
                <FieldLabel htmlFor="carpet-isPlaceholder">
                  عکس موقت است (شناسنامه پیش‌نمایش نشان داده می‌شود)
                </FieldLabel>
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>

      <Button type="submit" className="self-start" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Spinner aria-label="در حال ذخیره" />}
        {carpet ? "ذخیره‌ی تغییرات" : "افزودن فرش"}
      </Button>
    </form>
  );
}

function isImageIssue(details: unknown): boolean {
  return (
    Array.isArray(details) &&
    details.some(
      (d: unknown) => typeof d === "object" && d !== null && "path" in d && d.path === "image",
    )
  );
}
