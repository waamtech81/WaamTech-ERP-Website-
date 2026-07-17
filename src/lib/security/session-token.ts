/** Reject empty, oversized, or structurally invalid session token cookies. */
export function isValidSessionToken(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  const token = value.trim();
  if (token.length < 20 || token.length > 4096) return false;
  // JWT-shaped (header.payload.sig) or opaque Engine refresh tokens
  if (token.includes(".")) {
    const parts = token.split(".");
    if (parts.length !== 3 || parts.some((p) => !p.length)) return false;
  }
  if (/[\s\u0000-\u001F\u007F]/.test(token)) return false;
  return true;
}
