"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type Props = {
  /** otpauth:// URI (or any string an authenticator app expects) */
  value: string;
  size?: number;
  className?: string;
};

/**
 * Renders TOTP QR as a data: URL so Content-Security-Policy img-src allows it.
 * External QR APIs (e.g. api.qrserver.com) are blocked by CSP and break setup.
 */
export function AuthenticatorQr({ value, size = 180, className }: Props) {
  const [src, setSrc] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setSrc("");
    setError("");
    const payload = String(value || "").trim();
    if (!payload) return;

    void (async () => {
      try {
        const QR = await import("qrcode");
        const url = await QR.toDataURL(payload, {
          width: size,
          margin: 2,
          errorCorrectionLevel: "M",
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        if (!cancelled) setSrc(url);
      } catch {
        if (!cancelled) {
          setError("Unable to draw QR code. Use the manual key below.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!String(value || "").trim()) return null;

  if (error) {
    return (
      <p className="text-xs font-medium text-rose-700" role="alert">
        {error}
      </p>
    );
  }

  if (!src) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-[var(--portal-border)] bg-white"
        style={{ width: size, height: size }}
        aria-busy="true"
        aria-label="Generating authenticator QR code"
      >
        <Loader2 className="h-5 w-5 animate-spin text-[var(--portal-primary)]" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- data: URL QR; next/image not needed
    <img
      src={src}
      alt="Authenticator QR code — scan with Google Authenticator, Microsoft Authenticator, or Authy"
      width={size}
      height={size}
      className={
        className ||
        "rounded-lg border border-[var(--portal-border)] bg-white p-2 shadow-sm"
      }
    />
  );
}

export {
  buildTotpOtpAuthUrl,
  normalizeTotpSetupPayload,
} from "@/lib/portal/totp-setup";
