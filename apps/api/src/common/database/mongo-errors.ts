/** True for a MongoDB duplicate-key error (E11000), which is how a unique index reports a clash. */
export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: unknown }).code === 11000
  );
}
