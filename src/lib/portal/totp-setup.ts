/** Shared TOTP setup helpers — safe for server and client. */

export function buildTotpOtpAuthUrl(secret: string, accountLabel?: string | null) {
  const clean = String(secret || "").replace(/\s+/g, "").toUpperCase();
  if (!clean) return "";
  const account = String(accountLabel || "account").trim() || "account";
  const label = encodeURIComponent(`WAAMTO:${account}`);
  const params = new URLSearchParams({
    secret: clean,
    issuer: "WAAMTO",
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Normalize License Engine totp-setup payload field names. */
export function normalizeTotpSetupPayload(
  raw: unknown,
  accountLabel?: string | null
): { secret: string; otpauthUrl: string } {
  const row =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const secret = String(
    row.secret || row.base32 || row.totp_secret || row.shared_secret || ""
  )
    .replace(/\s+/g, "")
    .toUpperCase();

  let otpauthUrl = String(
    row.otpauth_url ||
      row.otpauthUrl ||
      row.otpauth_uri ||
      row.uri ||
      row.qr_uri ||
      row.provisioning_uri ||
      row.qr_code_url ||
      ""
  ).trim();

  // Some engines return a data URL / PNG already — not usable as otpauth scan payload.
  if (otpauthUrl && !otpauthUrl.toLowerCase().startsWith("otpauth://")) {
    if (otpauthUrl.startsWith("data:") || /^https?:\/\//i.test(otpauthUrl)) {
      otpauthUrl = "";
    }
  }

  if (!otpauthUrl && secret) {
    otpauthUrl = buildTotpOtpAuthUrl(secret, accountLabel);
  }

  return { secret, otpauthUrl };
}
