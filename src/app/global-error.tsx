"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error?.digest || error?.message);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <div style={{ maxWidth: 420, padding: 32, textAlign: "center" }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "#0549a4",
            }}
          >
            500
          </p>
          <h1
            style={{
              margin: "12px 0 0",
              fontSize: 28,
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            WAAMTO is temporarily unavailable
          </h1>
          <p style={{ marginTop: 12, color: "#334155", lineHeight: 1.5 }}>
            A critical error occurred. Please refresh the page or try again in a moment.
          </p>
          {error?.digest ? (
            <p style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <div
            style={{
              marginTop: 28,
              display: "flex",
              gap: 12,
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                border: "none",
                borderRadius: 12,
                padding: "10px 18px",
                background: "#0549a4",
                color: "#ffffff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                borderRadius: 12,
                padding: "10px 18px",
                border: "1px solid #cbd5e1",
                color: "#0f172a",
                textDecoration: "none",
                fontWeight: 600,
                background: "#ffffff",
              }}
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
