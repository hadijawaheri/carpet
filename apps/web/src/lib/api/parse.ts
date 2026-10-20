import type { ApiErrorBody, ErrorCode } from "@farsh/contracts";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const UNEXPECTED = "خطای غیرمنتظره‌ای رخ داد";

export async function parseResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;

  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const error = body as Partial<ApiErrorBody> | null;
    throw new ApiError(
      res.status,
      error?.code ?? "INTERNAL",
      error?.message ?? UNEXPECTED,
      error?.details,
    );
  }
  return body as T;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : UNEXPECTED;
}
