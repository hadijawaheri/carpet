import type { ErrorCode } from "@farsh/contracts";
import { HttpException } from "@nestjs/common";

/** An HttpException that carries its machine-readable code, for cases the status alone cannot tell apart. */
export class AppException extends HttpException {
  constructor(
    status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message, status);
  }
}
