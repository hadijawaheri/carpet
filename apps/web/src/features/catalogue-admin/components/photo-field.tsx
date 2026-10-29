"use client";

import type { UploadedImage } from "@farsh/contracts";
import Image from "next/image";
import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api/parse";

import { uploadCarpetImage } from "../api";
import { shrinkPhoto } from "../shrink-photo";

interface PhotoFieldProps {
  value: UploadedImage | null;
  onChange: (photo: UploadedImage) => void;
  /** A required-photo message from the form, shown like any other field error. */
  error?: string;
}

/** Uploads as soon as a photo is picked, so the preview is the processed photo the site will show. */
export function PhotoField({ value, onChange, error }: PhotoFieldProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const message = uploadError ?? error;

  const upload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      onChange(await uploadCarpetImage(await shrinkPhoto(file)));
    } catch (e: unknown) {
      setUploadError(getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Field data-invalid={Boolean(message)}>
      <FieldLabel htmlFor={id}>عکس فرش</FieldLabel>
      <FieldDescription>
        فقط عکس خود فرش، از روبه‌رو و با نور یکنواخت. JPEG، PNG یا WebP.
      </FieldDescription>
      {value ? (
        <div className="relative aspect-[3/4] w-40 bg-alabaster">
          <Image
            src={value.image}
            alt="عکس فعلی فرش"
            fill
            sizes="160px"
            className="object-contain"
            // The admin sees the stored photo itself, not a resized copy that may be stale
            unoptimized
          />
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        <input
          ref={input}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          // The button below is the control; a styled file input cannot show Persian text
          className="hidden"
          tabIndex={-1}
          disabled={uploading}
          aria-invalid={Boolean(message)}
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Cleared so picking the same file again after an error uploads it again
            event.target.value = "";
            if (file) void upload(file);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={uploading}
          aria-describedby={message ? `${id}-error` : undefined}
          onClick={() => input.current?.click()}
        >
          {uploading && <Spinner aria-label="در حال بارگذاری" />}
          {value ? "عوض کردن عکس" : "انتخاب عکس"}
        </Button>
      </div>
      {message ? <FieldError id={`${id}-error`}>{message}</FieldError> : null}
    </Field>
  );
}
