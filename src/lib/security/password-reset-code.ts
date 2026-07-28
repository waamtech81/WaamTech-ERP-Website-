import crypto from "crypto";

/**
 * Generate a cryptographically secure password reset code.
 * Uses base64url encoding for URL safety.
 * Length: 32 bytes = 256 bits of entropy
 */
export function generatePasswordResetCode(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Validate password reset code format.
 * Should be at least 20 characters (reasonable minimum for URL-safe base64url).
 */
export function isValidPasswordResetCode(code: string): boolean {
  return typeof code === "string" && code.trim().length >= 20;
}
