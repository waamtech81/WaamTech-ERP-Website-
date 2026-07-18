import {
  ApiErrorCode,
  PUBLIC_MESSAGES,
  messageForCode,
  resolveApiErrorCode,
  type ApiErrorCode as Code,
} from "@/lib/api/codes";

export type PublicError = {
  code: Code;
  message: string;
  status: number;
};

export type ErrorLogContext = {
  endpoint?: string;
  method?: string;
  userEmail?: string | null;
  workspace?: string | null;
  requestId?: string | null;
  constraint?: string | null;
  httpStatus?: number | null;
  /** Raw upstream / exception text — server logs only */
  technicalMessage?: string | null;
};

/**
 * Domain error that is already safe to return to clients.
 * Throw from handlers; `withApiHandler` / `toApiResponse` will serialize it.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: Code;
  readonly publicMessage: string;
  readonly logContext: ErrorLogContext;

  constructor(
    code: Code,
    options?: {
      message?: string;
      status?: number;
      cause?: unknown;
      logContext?: ErrorLogContext;
    }
  ) {
    const message = options?.message || PUBLIC_MESSAGES[code];
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.publicMessage = message;
    this.status = options?.status ?? defaultStatusForCode(code);
    this.logContext = options?.logContext || {};
    if (options?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

function defaultStatusForCode(code: Code): number {
  switch (code) {
    case ApiErrorCode.VALIDATION_ERROR:
    case ApiErrorCode.INVALID_PLAN:
      return 400;
    case ApiErrorCode.UNAUTHORIZED:
    case ApiErrorCode.INVALID_CREDENTIALS:
    case ApiErrorCode.INVALID_TOKEN:
      return 401;
    case ApiErrorCode.FORBIDDEN:
      return 403;
    case ApiErrorCode.NOT_FOUND:
      return 404;
    case ApiErrorCode.EMAIL_ALREADY_EXISTS:
    case ApiErrorCode.WORKSPACE_ALREADY_EXISTS:
    case ApiErrorCode.COMPANY_ALREADY_EXISTS:
    case ApiErrorCode.USERNAME_ALREADY_EXISTS:
    case ApiErrorCode.PHONE_ALREADY_EXISTS:
    case ApiErrorCode.LICENSE_ALREADY_EXISTS:
    case ApiErrorCode.RESERVED_EMAIL:
    case ApiErrorCode.CONFLICT:
      return 409;
    case ApiErrorCode.RATE_LIMITED:
      return 429;
    case ApiErrorCode.ACCOUNT_LOCKED:
      return 401;
    case ApiErrorCode.SERVICE_UNAVAILABLE:
      return 503;
    default:
      return 500;
  }
}

/** Detect technical / internal strings that must never reach end users. */
export function isTechnicalMessage(raw: string): boolean {
  const msg = raw.trim();
  if (!msg) return true;
  const lower = msg.toLowerCase();

  if (
    /license request failed\s*\(\d+\)/i.test(msg) ||
    /license engine request failed\s*\(\d+\)/i.test(msg) ||
    /request failed\s*\(\d+\)/i.test(msg) ||
    /\bhttps?\s*\d{3}\b/i.test(msg) ||
    /\bhttp\s*[:=]?\s*\d{3}\b/i.test(msg) ||
    /\(\s*\d{3}\s*\)\s*$/i.test(msg) ||
    /^error:\s*/i.test(msg)
  ) {
    return true;
  }

  if (
    lower.includes("prisma") ||
    lower.includes("sequelize") ||
    lower.includes("mongoose") ||
    lower.includes("sqlstate") ||
    lower.includes("sql error") ||
    lower.includes("syntax error") ||
    lower.includes("constraint") ||
    lower.includes("unique violation") ||
    lower.includes("duplicate key") ||
    lower.includes("foreign key") ||
    lower.includes("relation ") ||
    lower.includes("table ") ||
    lower.includes("column ") ||
    lower.includes("econnrefused") ||
    lower.includes("enotfound") ||
    lower.includes("econnreset") ||
    lower.includes("etimedout") ||
    lower.includes("socket hang up") ||
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("stack trace") ||
    lower.includes("at object.") ||
    lower.includes("at async ") ||
    lower.includes("node_modules") ||
    lower.includes("errno") ||
    lower.includes("aggregateerror") ||
    lower.includes("internal server error") ||
    lower.includes("unexpected token") ||
    lower.includes("json.parse") ||
    lower.includes("cannot read propert") ||
    lower.includes("is not a function") ||
    lower.includes("undefined is not") ||
    lower.includes("null is not") ||
    lower === "error" ||
    lower === "exception" ||
    /^http\s*\d{3}$/i.test(msg.trim()) ||
    /^\d{3}$/.test(msg.trim()) ||
    /p\d{4}/i.test(msg) || // Prisma P2002 etc.
    /\/[a-z]:\\/i.test(msg) || // Windows paths
    /\/(?:home|var|usr|tmp|app)\//i.test(msg) ||
    /traceback \(most recent call last\)/i.test(msg) ||
    /exception in/i.test(msg)
  ) {
    return true;
  }

  // UUIDs / long hex IDs look like internal diagnostics
  if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(msg)) {
    // Allow if the message is otherwise clearly user-facing and short
    if (msg.length > 120) return true;
  }

  return false;
}

/**
 * Map upstream / DB / Engine conflict text into a known friendly public error.
 * Returns null when no specific conflict pattern matches.
 */
export function detectConflict(raw?: string | null): PublicError | null {
  const msg = String(raw || "").toLowerCase();
  if (!msg) return null;

  if (
    msg.includes("reserved") &&
    (msg.includes("email") || msg.includes("@") || msg.includes("domain"))
  ) {
    return {
      code: ApiErrorCode.RESERVED_EMAIL,
      message: PUBLIC_MESSAGES[ApiErrorCode.RESERVED_EMAIL],
      status: 409,
    };
  }

  if (
    (msg.includes("email") || msg.includes("e-mail")) &&
    (msg.includes("already") ||
      msg.includes("exist") ||
      msg.includes("taken") ||
      msg.includes("duplicate") ||
      msg.includes("unique") ||
      msg.includes("in use") ||
      msg.includes("registered"))
  ) {
    return {
      code: ApiErrorCode.EMAIL_ALREADY_EXISTS,
      message: PUBLIC_MESSAGES[ApiErrorCode.EMAIL_ALREADY_EXISTS],
      status: 409,
    };
  }

  if (
    (msg.includes("workspace") || msg.includes("tenant") || msg.includes("slug")) &&
    (msg.includes("already") ||
      msg.includes("exist") ||
      msg.includes("taken") ||
      msg.includes("duplicate") ||
      msg.includes("unique") ||
      msg.includes("in use"))
  ) {
    return {
      code: ApiErrorCode.WORKSPACE_ALREADY_EXISTS,
      message: PUBLIC_MESSAGES[ApiErrorCode.WORKSPACE_ALREADY_EXISTS],
      status: 409,
    };
  }

  if (
    (msg.includes("company") || msg.includes("organization") || msg.includes("organisation")) &&
    (msg.includes("already") ||
      msg.includes("exist") ||
      msg.includes("taken") ||
      msg.includes("duplicate") ||
      msg.includes("unique") ||
      msg.includes("in use"))
  ) {
    return {
      code: ApiErrorCode.COMPANY_ALREADY_EXISTS,
      message: PUBLIC_MESSAGES[ApiErrorCode.COMPANY_ALREADY_EXISTS],
      status: 409,
    };
  }

  if (
    (msg.includes("username") || msg.includes("user name") || msg.includes("login name")) &&
    (msg.includes("already") ||
      msg.includes("exist") ||
      msg.includes("taken") ||
      msg.includes("duplicate") ||
      msg.includes("unique") ||
      msg.includes("in use"))
  ) {
    return {
      code: ApiErrorCode.USERNAME_ALREADY_EXISTS,
      message: PUBLIC_MESSAGES[ApiErrorCode.USERNAME_ALREADY_EXISTS],
      status: 409,
    };
  }

  if (
    (msg.includes("phone") || msg.includes("mobile") || msg.includes("cellphone")) &&
    (msg.includes("already") ||
      msg.includes("exist") ||
      msg.includes("taken") ||
      msg.includes("duplicate") ||
      msg.includes("unique") ||
      msg.includes("registered") ||
      msg.includes("in use"))
  ) {
    return {
      code: ApiErrorCode.PHONE_ALREADY_EXISTS,
      message: PUBLIC_MESSAGES[ApiErrorCode.PHONE_ALREADY_EXISTS],
      status: 409,
    };
  }

  if (
    msg.includes("license") &&
    (msg.includes("already") ||
      msg.includes("exist") ||
      msg.includes("active") ||
      msg.includes("duplicate"))
  ) {
    return {
      code: ApiErrorCode.LICENSE_ALREADY_EXISTS,
      message: PUBLIC_MESSAGES[ApiErrorCode.LICENSE_ALREADY_EXISTS],
      status: 409,
    };
  }

  // Generic unique / duplicate key without a clear field
  if (
    msg.includes("unique constraint") ||
    msg.includes("duplicate key") ||
    msg.includes("unique_violation") ||
    msg.includes("p2002")
  ) {
    return {
      code: ApiErrorCode.CONFLICT,
      message: PUBLIC_MESSAGES[ApiErrorCode.CONFLICT],
      status: 409,
    };
  }

  return null;
}

function statusFallback(status: number): PublicError {
  if (status === 400) {
    return {
      code: ApiErrorCode.VALIDATION_ERROR,
      message: PUBLIC_MESSAGES[ApiErrorCode.VALIDATION_ERROR],
      status: 400,
    };
  }
  if (status === 401) {
    return {
      code: ApiErrorCode.UNAUTHORIZED,
      message: PUBLIC_MESSAGES[ApiErrorCode.UNAUTHORIZED],
      status: 401,
    };
  }
  if (status === 403) {
    return {
      code: ApiErrorCode.FORBIDDEN,
      message: PUBLIC_MESSAGES[ApiErrorCode.FORBIDDEN],
      status: 403,
    };
  }
  if (status === 404) {
    return {
      code: ApiErrorCode.NOT_FOUND,
      message: PUBLIC_MESSAGES[ApiErrorCode.NOT_FOUND],
      status: 404,
    };
  }
  if (status === 409) {
    return {
      code: ApiErrorCode.CONFLICT,
      message: PUBLIC_MESSAGES[ApiErrorCode.CONFLICT],
      status: 409,
    };
  }
  if (status === 429) {
    return {
      code: ApiErrorCode.RATE_LIMITED,
      message: PUBLIC_MESSAGES[ApiErrorCode.RATE_LIMITED],
      status: 429,
    };
  }
  if (status === 408 || status === 502 || status === 503 || status === 504) {
    return {
      code: ApiErrorCode.SERVICE_UNAVAILABLE,
      message: PUBLIC_MESSAGES[ApiErrorCode.SERVICE_UNAVAILABLE],
      status: status === 408 || status === 504 ? 504 : 503,
    };
  }
  return {
    code: ApiErrorCode.INTERNAL_ERROR,
    message: PUBLIC_MESSAGES[ApiErrorCode.INTERNAL_ERROR],
    status: status >= 400 && status < 600 ? status : 500,
  };
}

/**
 * Convert any upstream Engine / DB / HTTP error into a safe public error.
 *
 * Priority:
 * 1. Known Engine `code` → map to PUBLIC_MESSAGES (prefer Engine message when safe)
 * 2. Safe Engine `message` (non-technical) → keep as-is
 * 3. Conflict heuristics only when message is missing/technical
 * 4. HTTP status fallback / generic INTERNAL_ERROR
 */
export function toPublicError(
  raw?: string | null,
  status?: number,
  options?: { preferEmailConflictOn409?: boolean; code?: string | null }
): PublicError {
  const text = String(raw || "").trim();
  const knownCode = resolveApiErrorCode(options?.code);

  if (knownCode) {
    const isBusinessSentence =
      text.length >= 20 &&
      text.length <= 180 &&
      /\s/.test(text) &&
      !isTechnicalMessage(text);
    return {
      code: knownCode,
      message: isBusinessSentence ? text : messageForCode(knownCode),
      status:
        typeof status === "number" && status >= 400 && status < 600
          ? status
          : defaultStatusForCode(knownCode),
    };
  }

  // Prefer a clear, non-technical Engine message over keyword remapping
  if (text && !isTechnicalMessage(text) && text.length <= 180) {
    const conflictHint = detectConflict(text);
    const byStatus =
      typeof status === "number" && status > 0 ? statusFallback(status) : null;
    return {
      code: conflictHint?.code || byStatus?.code || ApiErrorCode.VALIDATION_ERROR,
      message: text,
      status:
        conflictHint?.status ||
        byStatus?.status ||
        (typeof status === "number" && status >= 400 && status < 500 ? status : 400),
    };
  }

  // Message missing or technical — try conflict heuristics on raw text
  const conflict = detectConflict(text);
  if (conflict) return conflict;

  if (typeof status === "number" && status > 0) {
    if (status === 409) {
      if (options?.preferEmailConflictOn409) {
        return {
          code: ApiErrorCode.EMAIL_ALREADY_EXISTS,
          message: PUBLIC_MESSAGES[ApiErrorCode.EMAIL_ALREADY_EXISTS],
          status: 409,
        };
      }
      return {
        code: ApiErrorCode.CONFLICT,
        message: PUBLIC_MESSAGES[ApiErrorCode.CONFLICT],
        status: 409,
      };
    }
    return statusFallback(status);
  }

  return {
    code: ApiErrorCode.INTERNAL_ERROR,
    message: PUBLIC_MESSAGES[ApiErrorCode.INTERNAL_ERROR],
    status: 500,
  };
}

/** Extract a constraint name from technical error text for server logs. */
export function extractConstraintName(raw?: string | null): string | null {
  const text = String(raw || "");
  const patterns = [
    /constraint [`"']?([a-zA-Z0-9_]+)[`"']?/i,
    /unique index [`"']?([a-zA-Z0-9_]+)[`"']?/i,
    /Key \(([^)]+)\)=/i,
    /(uniq_[a-zA-Z0-9_]+)/i,
    /(uk_[a-zA-Z0-9_]+)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1].slice(0, 120);
  }
  return null;
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.publicMessage;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}
