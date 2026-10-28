"use client";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import type { ParsedCount } from "../parse-count";

/** A numeric field that shows its parse error under it and links the two for screen readers. */
export function CountField({
  id,
  label,
  hint,
  value,
  parsed,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  parsed: ParsedCount;
  onChange: (value: string) => void;
}) {
  const invalid = !parsed.ok;
  const describedBy = [hint ? `${id}-hint` : null, invalid ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="numeric"
        autoComplete="off"
        aria-invalid={invalid}
        aria-describedby={describedBy || undefined}
      />
      {hint ? <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription> : null}
      {parsed.ok ? null : <FieldError id={`${id}-error`}>{parsed.error}</FieldError>}
    </Field>
  );
}
