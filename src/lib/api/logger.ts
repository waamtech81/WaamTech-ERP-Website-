import { extractConstraintName, extractErrorMessage, type ErrorLogContext } from "@/lib/api/errors";

export type ApiLogEntry = {
  level: "error" | "warn" | "info";
  timestamp: string;
  requestId: string;
  endpoint?: string;
  method?: string;
  httpStatus?: number | null;
  userEmail?: string | null;
  workspace?: string | null;
  constraint?: string | null;
  message: string;
  exception?: string | null;
  stack?: string | null;
};

function newRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

/**
 * Structured server-side API error log. Never send this payload to clients.
 */
export function logApiError(
  error: unknown,
  context: ErrorLogContext = {}
): string {
  const requestId = context.requestId || newRequestId();
  const technical =
    context.technicalMessage || extractErrorMessage(error);
  const constraint =
    context.constraint || extractConstraintName(technical) || null;

  let stack: string | null = null;
  let exceptionName: string | null = null;
  if (error instanceof Error) {
    exceptionName = error.name;
    stack = error.stack || null;
    const cause = (error as Error & { cause?: unknown }).cause;
    if (!stack && cause instanceof Error) {
      stack = cause.stack || null;
      exceptionName = exceptionName || cause.name;
    }
  }

  const entry: ApiLogEntry = {
    level: "error",
    timestamp: new Date().toISOString(),
    requestId,
    endpoint: context.endpoint || undefined,
    method: context.method || undefined,
    httpStatus: context.httpStatus ?? null,
    userEmail: context.userEmail ?? null,
    workspace: context.workspace ?? null,
    constraint,
    message: technical,
    exception: exceptionName,
    stack,
  };

  console.error("[api-error]", JSON.stringify(entry));
  return requestId;
}

export function createRequestId(): string {
  return newRequestId();
}
