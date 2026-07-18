import { NextResponse } from "next/server";
import { ApiErrorCode, PUBLIC_MESSAGES } from "@/lib/api/codes";
import {
  ApiError,
  extractErrorMessage,
  toPublicError,
  type ErrorLogContext,
} from "@/lib/api/errors";
import { createRequestId, logApiError } from "@/lib/api/logger";

export type ApiSuccessBody<T = unknown> = {
  success: true;
  message: string;
  data?: T;
  [key: string]: unknown;
};

export type ApiFailBody = {
  success: false;
  code: string;
  message: string;
  data?: unknown;
  [key: string]: unknown;
};

export function apiSuccess<T = unknown>(
  message: string,
  options?: {
    data?: T;
    status?: number;
    headers?: HeadersInit;
    extra?: Record<string, unknown>;
  }
): NextResponse {
  const body: ApiSuccessBody<T> = {
    success: true,
    message,
    ...(options?.data !== undefined ? { data: options.data } : {}),
    ...(options?.extra || {}),
  };
  return NextResponse.json(body, {
    status: options?.status ?? 200,
    headers: options?.headers,
  });
}

export function apiFail(
  message: string,
  options?: {
    code?: string;
    status?: number;
    headers?: HeadersInit;
    data?: unknown;
    extra?: Record<string, unknown>;
  }
): NextResponse {
  const status = options?.status ?? 400;
  const code =
    options?.code ||
    (status >= 500
      ? ApiErrorCode.INTERNAL_ERROR
      : status === 429
        ? ApiErrorCode.RATE_LIMITED
        : status === 409
          ? ApiErrorCode.CONFLICT
          : status === 401
            ? ApiErrorCode.UNAUTHORIZED
            : status === 403
              ? ApiErrorCode.FORBIDDEN
              : status === 404
                ? ApiErrorCode.NOT_FOUND
                : ApiErrorCode.VALIDATION_ERROR);

  const body: ApiFailBody = {
    success: false,
    code,
    message:
      status >= 500
        ? PUBLIC_MESSAGES[ApiErrorCode.INTERNAL_ERROR]
        : message || PUBLIC_MESSAGES[ApiErrorCode.INTERNAL_ERROR],
    ...(options?.data !== undefined ? { data: options.data } : {}),
    ...(options?.extra || {}),
  };

  // For 5xx always force the generic message regardless of caller input
  if (status >= 500) {
    body.message = PUBLIC_MESSAGES[ApiErrorCode.INTERNAL_ERROR];
    body.code = ApiErrorCode.INTERNAL_ERROR;
  }

  return NextResponse.json(body, {
    status,
    headers: options?.headers,
  });
}

/**
 * Serialize any thrown value into a safe API response and log technical details.
 */
export function toErrorResponse(
  error: unknown,
  context: ErrorLogContext = {}
): NextResponse {
  const requestId = context.requestId || createRequestId();

  if (error instanceof ApiError) {
    logApiError(error, {
      ...context,
      ...error.logContext,
      requestId,
      httpStatus: error.status,
      technicalMessage:
        error.logContext.technicalMessage ||
        extractErrorMessage(
          (error as Error & { cause?: unknown }).cause ?? error
        ),
    });
    return apiFail(error.publicMessage, {
      code: error.code,
      status: error.status,
      headers: {
        "X-Request-Id": requestId,
      },
    });
  }

  const technical = extractErrorMessage(error);
  const publicError = toPublicError(technical, context.httpStatus ?? 500);

  logApiError(error, {
    ...context,
    requestId,
    httpStatus: publicError.status,
    technicalMessage: technical,
  });

  return apiFail(publicError.message, {
    code: publicError.code,
    status: publicError.status >= 500 ? 500 : publicError.status,
    headers: {
      "X-Request-Id": requestId,
    },
  });
}

/**
 * Map an upstream License Engine / commercial result into a safe fail response.
 * Always returns Engine `message` when it is user-safe; logs technical details server-side.
 */
export function upstreamFail(
  rawMessage: string | null | undefined,
  status: number,
  context: ErrorLogContext = {},
  upstreamCode?: string | null
): NextResponse {
  const requestId = context.requestId || createRequestId();
  const publicError = toPublicError(rawMessage, status, { code: upstreamCode });
  const safeStatus =
    publicError.status >= 500
      ? 502
      : publicError.status;

  logApiError(new Error(String(rawMessage || `Upstream failed (${status})`)), {
    ...context,
    requestId,
    httpStatus: status,
    technicalMessage: rawMessage || `Upstream HTTP ${status}`,
  });

  return apiFail(publicError.message, {
    code: publicError.code,
    status: safeStatus,
    headers: {
      "X-Request-Id": requestId,
    },
  });
}
