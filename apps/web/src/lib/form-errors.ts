import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { ApiError, getErrorMessage } from "./api/parse";

function isIssueList(details: unknown): details is { path: string; message: string }[] {
  return (
    Array.isArray(details) &&
    details.every(
      (d: unknown) =>
        typeof d === "object" &&
        d !== null &&
        typeof (d as { path?: unknown }).path === "string" &&
        typeof (d as { message?: unknown }).message === "string",
    )
  );
}

/**
 * A server error lands where the visitor can act on it: the API's validation issues next to their
 * fields (when the form has them), anything else as a toast. `inline` puts the rest on the form's
 * `root.server` error instead, for forms inside a modal, which hides the toaster from screen readers.
 */
export function showServerError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  { inline = false }: { inline?: boolean } = {},
): void {
  if (error instanceof ApiError && isIssueList(error.details)) {
    const known = error.details.filter((d) => (fields as readonly string[]).includes(d.path));
    for (const issue of known) setError(issue.path as Path<T>, { message: issue.message });
    if (known.length > 0) return;
  }
  if (inline) setError("root.server", { message: getErrorMessage(error) });
  else toast.error(getErrorMessage(error));
}
