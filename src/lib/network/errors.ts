/**
 * Map raw fetch / Abort / offline failures to user-facing copy.
 * Never surface "Failed to fetch" or similar engine messages in the UI.
 */

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

    // Already-friendly API messages
    if (error.message && !msg.includes("fetch") && error.message.length < 180) {
      return error.message;
    }
  }

  return fallback || "Something went wrong. Please try again.";
}

export function statusToFriendlyMessage(status: number, apiMessage?: string): string {
  const cleaned = String(apiMessage || "").trim();
  const lower = cleaned.toLowerCase();
  const isRawNetwork =
    !cleaned ||
    lower.includes("failed to fetch") ||
    lower.includes("fetch failed") ||
    lower.includes("networkerror") ||
    lower.includes("econnrefused");

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
      return "Too many requests. Please wait a moment and try again.";
    case 503:
      return "The service is temporarily unavailable. Please try again shortly.";
    default:
      if (status >= 500) return "A server error occurred. Please try again.";
      return cleaned && !isRawNetwork
        ? cleaned
        : "Request failed. Please try again.";
  }
}
