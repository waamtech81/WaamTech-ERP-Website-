/**
 * Stable public API error codes — safe to expose to clients.
 * Prefer License Engine `code` when present; fall back to these messages.
 */

export const ApiErrorCode = {
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  WORKSPACE_ALREADY_EXISTS: "WORKSPACE_ALREADY_EXISTS",
  COMPANY_ALREADY_EXISTS: "COMPANY_ALREADY_EXISTS",
  USERNAME_ALREADY_EXISTS: "USERNAME_ALREADY_EXISTS",
  PHONE_ALREADY_EXISTS: "PHONE_ALREADY_EXISTS",
  LICENSE_ALREADY_EXISTS: "LICENSE_ALREADY_EXISTS",
  RESERVED_EMAIL: "RESERVED_EMAIL",
  INVALID_PLAN: "INVALID_PLAN",
  INVALID_TOKEN: "INVALID_TOKEN",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

export const PUBLIC_MESSAGES: Record<ApiErrorCode, string> = {
  [ApiErrorCode.EMAIL_ALREADY_EXISTS]:
    "This email address is already registered. Please sign in or use a different email.",
  [ApiErrorCode.WORKSPACE_ALREADY_EXISTS]:
    "This workspace name is already in use. Please choose another name.",
  [ApiErrorCode.COMPANY_ALREADY_EXISTS]:
    "A company with this name already exists.",
  [ApiErrorCode.USERNAME_ALREADY_EXISTS]: "This username is already taken.",
  [ApiErrorCode.PHONE_ALREADY_EXISTS]:
    "This phone number is already registered.",
  [ApiErrorCode.LICENSE_ALREADY_EXISTS]:
    "An active license already exists for this request.",
  [ApiErrorCode.RESERVED_EMAIL]:
    "This email address cannot be used for customer registration.",
  [ApiErrorCode.INVALID_PLAN]:
    "The selected subscription plan is unavailable.",
  [ApiErrorCode.INVALID_TOKEN]: "This link is invalid or has expired.",
  [ApiErrorCode.ACCOUNT_LOCKED]:
    "Your account is temporarily locked. Please try again later or contact support.",
  [ApiErrorCode.INVALID_CREDENTIALS]: "Incorrect email or password.",
  [ApiErrorCode.VALIDATION_ERROR]: "Please check your input and try again.",
  [ApiErrorCode.UNAUTHORIZED]:
    "Login failed. Check your credentials and try again.",
  [ApiErrorCode.FORBIDDEN]:
    "You do not have permission to perform this action.",
  [ApiErrorCode.NOT_FOUND]: "The requested resource was not found.",
  [ApiErrorCode.CONFLICT]:
    "This request conflicts with an existing record. Please review and try again.",
  [ApiErrorCode.RATE_LIMITED]:
    "Too many requests. Please wait a moment and try again.",
  [ApiErrorCode.SERVICE_UNAVAILABLE]:
    "The service is temporarily unavailable. Please try again shortly.",
  [ApiErrorCode.INTERNAL_ERROR]:
    "Something went wrong. Please try again later.",
};

/** Known Engine / Website codes → canonical Website code (aliases included). */
const CODE_ALIASES: Record<string, ApiErrorCode> = {
  EMAIL_ALREADY_EXISTS: ApiErrorCode.EMAIL_ALREADY_EXISTS,
  WORKSPACE_ALREADY_EXISTS: ApiErrorCode.WORKSPACE_ALREADY_EXISTS,
  COMPANY_ALREADY_EXISTS: ApiErrorCode.COMPANY_ALREADY_EXISTS,
  USERNAME_ALREADY_EXISTS: ApiErrorCode.USERNAME_ALREADY_EXISTS,
  PHONE_ALREADY_EXISTS: ApiErrorCode.PHONE_ALREADY_EXISTS,
  LICENSE_ALREADY_EXISTS: ApiErrorCode.LICENSE_ALREADY_EXISTS,
  LICENSE_KEY_EXISTS: ApiErrorCode.LICENSE_ALREADY_EXISTS,
  RESERVED_EMAIL: ApiErrorCode.RESERVED_EMAIL,
  INVALID_PLAN: ApiErrorCode.INVALID_PLAN,
  INVALID_TOKEN: ApiErrorCode.INVALID_TOKEN,
  ACCOUNT_LOCKED: ApiErrorCode.ACCOUNT_LOCKED,
  INVALID_CREDENTIALS: ApiErrorCode.INVALID_CREDENTIALS,
  VALIDATION_ERROR: ApiErrorCode.VALIDATION_ERROR,
  UNAUTHORIZED: ApiErrorCode.UNAUTHORIZED,
  FORBIDDEN: ApiErrorCode.FORBIDDEN,
  NOT_FOUND: ApiErrorCode.NOT_FOUND,
  CONFLICT: ApiErrorCode.CONFLICT,
  DUPLICATE_ENTRY: ApiErrorCode.CONFLICT,
  RATE_LIMITED: ApiErrorCode.RATE_LIMITED,
  RATE_LIMIT: ApiErrorCode.RATE_LIMITED,
  TOO_MANY_REQUESTS: ApiErrorCode.RATE_LIMITED,
  SERVICE_UNAVAILABLE: ApiErrorCode.SERVICE_UNAVAILABLE,
  INTERNAL_ERROR: ApiErrorCode.INTERNAL_ERROR,
};

export function normalizeApiErrorCode(
  raw?: string | null
): ApiErrorCode | null {
  if (!raw || typeof raw !== "string") return null;
  const key = raw.trim().toUpperCase();
  return CODE_ALIASES[key] || null;
}

/** Alias used across Website error mapping. */
export const resolveApiErrorCode = normalizeApiErrorCode;

export function messageForCode(code: ApiErrorCode): string {
  return PUBLIC_MESSAGES[code];
}
