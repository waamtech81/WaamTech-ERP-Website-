/**
 * Map raw fetch / Abort / offline failures to user-facing copy.
 * Never surface "Failed to fetch", Engine status text, or other technical messages.
 */

import { isTechnicalMessage } from "@/lib/api/errors";
import {
  PUBLIC_MESSAGES,
  ApiErrorCode,
  messageForCode,
  resolveApiErrorCode,
} from "@/lib/api/codes";

export function isOffline(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.onLine === false;
}

export function friendlyNetworkError(error: unknown, fallback?: string): string {
  if (isOffline()) {
    return "You appear to be offline. Check your connection and try again.";
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return "The request timed out. Please retry.";
  }

  if (error instanceof Error) {
    const name = error.name || "";
    const msg = (error.message || "").toLowerCase();

    if (name === "AbortError" || msg.includes("aborted") || msg.includes("timeout")) {
      return "The request timed out. Please retry.";
    }

    if (
      msg.includes("failed to fetch") ||
      msg.includes("fetch failed") ||
      msg.includes("networkerror") ||
      msg.includes("network request failed") ||
      msg.includes("load failed") ||
      msg.includes("econnrefused") ||
      msg.includes("enotfound") ||
      msg.includes("socket")
    ) {
      return "Unable to reach the server. Check your connection and try again.";
    }

    // Only pass through short, already-friendly API messages
    if (
      error.message &&
      !isTechnicalMessage(error.message) &&
      error.message.length < 180
    ) {
      return error.message;
    }
  }

  return fallback || PUBLIC_MESSAGES[ApiErrorCode.INTERNAL_ERROR];
}

export function statusToFriendlyMessage(status: number, apiMessage?: string): string {
  const cleaned = String(apiMessage || "").trim();
  const isRawNetwork =
    !cleaned ||
    isTechnicalMessage(cleaned) ||
    cleaned.toLowerCase().includes("failed to fetch") ||
    cleaned.toLowerCase().includes("fetch failed") ||
    cleaned.toLowerCase().includes("networkerror") ||
    cleaned.toLowerCase().includes("econnrefused");

  if (cleaned && cleaned.length < 180 && !isRawNetwork) {
    return cleaned;
  }
  switch (status) {
    case 401:
      return "Your session expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 408:
    case 504:
      return "The request timed out. Please retry.";
    case 429:
      return PUBLIC_MESSAGES[ApiErrorCode.RATE_LIMITED];
    case 503:
      return PUBLIC_MESSAGES[ApiErrorCode.SERVICE_UNAVAILABLE];
    default:
      if (status >= 500) return PUBLIC_MESSAGES[ApiErrorCode.INTERNAL_ERROR];
      return cleaned && !isRawNetwork
        ? cleaned
        : "Request failed. Please try again.";
  }
}

/** Prefer API `message` field; never fall back to HTTP status text. */
export function apiMessageFromJson(
  json: { message?: unknown; code?: unknown; success?: unknown } | null | undefined,
  fallback: string
): string {
  const msg = typeof json?.message === "string" ? json.message.trim() : "";
  if (msg && !isTechnicalMessage(msg) && msg.length < 180) return msg;

  const code =
    typeof json?.code === "string" ? resolveApiErrorCode(json.code) : null;
  if (code) return messageForCode(code);

  return fallback || PUBLIC_MESSAGES[ApiErrorCode.INTERNAL_ERROR];
}
