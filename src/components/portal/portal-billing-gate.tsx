"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { portalCheckoutHref } from "@/lib/portal/checkout-session";
import { resolvePortalBillingGate } from "@/lib/portal/billing-gate";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";
import { resolvePortalJourneyFromDashboard } from "@/lib/portal/package-type";

const SKIP_PREFIXES = [
  "/portal/checkout",
  "/portal/settings",
];

function checkoutHrefFromPayload(data: unknown, mode: string): string | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const checkout =
    row.checkout && typeof row.checkout === "object"
      ? (row.checkout as Record<string, unknown>)
      : row;
  const token = String(checkout.session_token || "").trim();
  if (token) return portalCheckoutHref(mode, token);
  const url = String(checkout.checkout_url || "").trim();
  if (url.startsWith("/portal/")) return url;
  return null;
}

/**
 * When trial or paid subscription requires payment, auto-start checkout and redirect.
 * Portal remains accessible for billing management; ERP stays blocked until payment completes.
 */
export function PortalBillingGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { data, loading } = usePortalContext();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const startedRef = useRef(false);

  const gate = resolvePortalBillingGate(data);
  const skipped = SKIP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  useEffect(() => {
    if (loading || !data || skipped || !gate.required || startedRef.current) return;
    if (!gate.subscriptionId && gate.mode !== "trial-convert") return;
    if (
      gate.mode === "trial-convert" &&
      !gate.subscriptionId &&
      !gate.licenseId
    ) {
      return;
    }

    startedRef.current = true;
    setBusy(true);
    setError("");

    (async () => {
      try {
        const res = await fetch("/api/portal/billing/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({
            mode: gate.mode,
            subscription_id: gate.subscriptionId || undefined,
            license_id: gate.licenseId || undefined,
            plan_id: gate.planId || undefined,
            billing_cycle: gate.billingCycle || "yearly",
          }),
        });
        const json = await res.json();
        if (!json.success) {
          startedRef.current = false;
          setError(apiMessageFromJson(json, "Unable to open checkout."));
          setBusy(false);
          return;
        }

        const href = checkoutHrefFromPayload(json.data, gate.mode);
        if (href) {
          const params = new URLSearchParams();
          params.set("mode", gate.mode);
          if (gate.planName) params.set("plan", gate.planName);
          params.set("reason", gate.reason || "");
          const sep = href.includes("?") ? "&" : "?";
          router.replace(`${href}${sep}${params.toString()}`);
          return;
        }

        startedRef.current = false;
        setError("Checkout session was not returned. Open Plans to continue.");
        setBusy(false);
      } catch (err) {
        startedRef.current = false;
        setError(friendlyNetworkError(err));
        setBusy(false);
      }
    })();
  }, [data, gate, loading, router, skipped]);

  if (skipped || !gate.required) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[var(--portal-bg)]/95 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-labelledby="portal-billing-gate-title"
      aria-describedby="portal-billing-gate-desc"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 shadow-[var(--portal-shadow)]">
        <h2
          id="portal-billing-gate-title"
          className="text-lg font-semibold text-[var(--portal-fg)]"
        >
          {gate.title}
        </h2>
        <p id="portal-billing-gate-desc" className="mt-2 text-sm leading-relaxed text-[var(--portal-muted)]">
          {gate.message}
        </p>
        {busy ? (
          <div className="mt-5 flex items-center gap-2 text-sm text-[var(--portal-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening secure checkout…
          </div>
        ) : null}
        {error ? (
          <p className="mt-4 text-sm text-rose-600">{error}</p>
        ) : null}
        {!busy && error ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl bg-[var(--portal-primary)] px-4 py-2 text-sm font-semibold text-white"
              onClick={() => {
                startedRef.current = false;
                setError("");
              }}
            >
              Try again
            </button>
            {resolvePortalJourneyFromDashboard(data) === "custom" ? (
              <a
                href="/portal/billing"
                className="rounded-xl border border-[var(--portal-border)] px-4 py-2 text-sm font-medium"
              >
                Open billing
              </a>
            ) : (
              <a
                href="/portal/plans?intent=renew"
                className="rounded-xl border border-[var(--portal-border)] px-4 py-2 text-sm font-medium"
              >
                Open plans
              </a>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
