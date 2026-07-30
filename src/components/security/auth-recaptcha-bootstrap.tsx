import Script from "next/script";

/** Load reCAPTCHA v3 before auth UI hydrates — must run ahead of chat/analytics widgets. */
export function AuthRecaptchaBootstrap({
  enabled,
  siteKey,
}: {
  enabled: boolean;
  siteKey: string;
}) {
  if (!enabled || !siteKey) return null;

  return (
    <Script
      id="google-recaptcha-v3-bootstrap"
      src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`}
      strategy="beforeInteractive"
    />
  );
}
