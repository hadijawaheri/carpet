import type { ApiErrorBody, ErrorCode } from "@farsh/contracts";
import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import { Catch, HttpException } from "@nestjs/common";
import type { Request, Response } from "express";
import { PinoLogger } from "nestjs-pino";

import { AppException } from "../app-exception.js";
import { ZodValidationException } from "../zod/zod-validation.pipe.js";

const STATUS_TO_CODE: Record<number, ErrorCode> = {
  400: "VALIDATION_FAILED",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "RATE_LIMITED",
};

const INTERNAL_MESSAGE = "خطای غیرمنتظره‌ای رخ داد";

// Nest and its libraries throw English defaults ("Cannot GET /x", "ThrottlerException: Too Many Requests");
// visitors only ever see Persian.
const DEFAULT_MESSAGES: Record<number, string> = {
  400: "درخواست معتبر نیست",
  401: "لطفاً وارد حساب خود شوید",
  403: "به این بخش دسترسی ندارید",
  404: "مورد درخواستی یافت نشد",
  409: "این مورد از قبل وجود دارد",
  413: "حجم درخواست بیش از حد مجاز است",
  429: "تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید",
};

const PERSIAN = /[؀-ۿ]/;

function messageOf(exception: HttpException): string | undefined {
  const response = exception.getResponse();
  if (typeof response === "string") return response;
  const message = (response as { message?: unknown }).message;
  if (Array.isArray(message)) return typeof message[0] === "string" ? message[0] : undefined;
  return typeof message === "string" ? message : exception.message;
}

function persianMessage(statusCode: number, message: string | undefined): string {
  if (statusCode >= 500) return INTERNAL_MESSAGE;
  if (message && PERSIAN.test(message)) return message;
  return DEFAULT_MESSAGES[statusCode] ?? INTERNAL_MESSAGE;
}

export function toErrorBody(exception: unknown, requestId?: string): ApiErrorBody {
  if (exception instanceof ZodValidationException) {
    return {
      statusCode: 400,
      code: "VALIDATION_FAILED",
      message: exception.message,
      details: exception.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
      requestId,
    };
  }
  if (exception instanceof AppException) {
    const statusCode = exception.getStatus();
    return {
      statusCode,
      code: exception.code,
      // Our own exceptions carry a message written for the visitor, even for a 5xx
      message:
        statusCode >= 500 && exception.code !== "INTERNAL" && PERSIAN.test(exception.message)
          ? exception.message
          : persianMessage(statusCode, messageOf(exception)),
      ...(exception.details === undefined ? {} : { details: exception.details }),
      requestId,
    };
  }
  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();
    return {
      statusCode,
      code: STATUS_TO_CODE[statusCode] ?? "INTERNAL",
      message: persianMessage(statusCode, messageOf(exception)),
      requestId,
    };
  }
  return { statusCode: 500, code: "INTERNAL", message: INTERNAL_MESSAGE, requestId };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const body = toErrorBody(exception, req.id === undefined ? undefined : String(req.id));
    if (body.statusCode >= 500) this.logger.error({ err: exception }, "Unhandled exception");

    res.status(body.statusCode).json(body);
  }
}
