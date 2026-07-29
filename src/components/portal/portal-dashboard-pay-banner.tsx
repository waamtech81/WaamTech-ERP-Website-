"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PortalDashboard } from "@/lib/portal/dashboard";
import { showRenewalUi } from "@/lib/portal/package-type";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";
import { portalCheckoutHref } from "@/lib/portal/checkout-session";
import { cn } from "@/lib/utils";

function checkoutHrefFromPayload(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const checkout =
    row.checkout && typeof row.checkout === "object"
      ? (row.checkout as Record<string, unknown>)
      : row;
  const token = String(checkout.session_token || "").trim();
  if (token) return portalCheckoutHref("renew", token);
  const url = String(checkout.checkout_url || "").trim();
  if (url.startsWith("/portal/")) return url;
  if (url.includes("/portal/checkout")) {
    try {
      const parsed = new URL(url, window.location.origin);
      const legacyToken = parsed.searchParams.get("session");
      const legacyMode = parsed.searchParams.get("mode") || "renew";
      if (legacyToken) return portalCheckoutHref(legacyMode, legacyToken);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      /* ignore */
    }
  }
  return null;
}

/** Top dashboard banner — renew / pay bill goes straight to checkout. */
export function PortalDashboardPayBanner({ data }: { data: PortalDashboard }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const sub =
    data.subscriptions?.find((s) =>
      ["active", "trial", "trialing", "grace", "suspended", "expired", "pending"].includes(
        String(s.status || "").toLowerCase()
      )
    ) || data.subscriptions?.[0];

  const subStatus = String(sub?.status || data.subscription?.status || "").toLowerCase();
  const trialDays = data.subscription?.trialRemainingDays;
  const outstanding = data.billing?.outstandingBalance;
  const planName = data.subscription?.currentPlan || sub?.plan_name;
  const billingCycle = sub?.billing_cycle || data.licenses?.[0]?.billing_cycle;
  const canRenew = showRenewalUi(billingCycle);

  const expiredLicense = data.licenses.some((l) => {
    const st = String(l.effective_status || l.status || "").toLowerCase();
    return st === "expired" || st === "suspended" || (l.expired && !l.in_grace);
  });

  const expiringSoon = data.licenses.some(
    (l) => typeof l.days_remaining === "number" && l.days_remaining >= 0 && l.days_remaining <= 14
  );

  const showBanner =
    Boolean(sub?.id) &&
    canRenew &&
    (subStatus === "trial" ||
      subStatus === "trialing" ||
      subStatus === "grace" ||
      subStatus === "expired" ||
      subStatus === "suspended" ||
      expiredLicense ||
      expiringSoon ||
      Boolean(outstanding));

  if (!showBanner || !sub?.id) return null;

  let title = "Renew your subscription";
  let description = planName
    ? `${planName} — complete checkout to keep your WAAMTO access active.`
    : "Complete checkout to renew your package.";

  if (subStatus === "trial" || subStatus === "trialing") {
    title = "Activate your trial";
    description =
      trialDays != null
        ? `Trial ends in ${trialDays} day${trialDays === 1 ? "" : "s"}. Pay now to activate your plan.`
        : "Your trial is active. Pay now to continue without interruption.";
  } else if (outstanding) {
    title = "Pay outstanding balance";
    description = `Amount due: ${outstanding}. Continue to secure checkout.`;
  } else if (expiredLicense || subStatus === "expired") {
    title = "Subscription expired";
    description = "Renew now to restore portal and ERP access.";
  } else if (expiringSoon) {
    title = "Renewal due soon";
    description = "Your license is expiring soon. Pay now to avoid interruption.";
  }

  function startCheckout() {
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/portal/billing/renew", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({
            subscription_id: sub.id,
            gateway: "paypal",
            payment_method: "paypal",
          }),
        });
        const json = await res.json();
        if (!json.success) {
          setError(apiMessageFromJson(json, "Unable to start checkout."));
          return;
        }
        const href = checkoutHrefFromPayload(json.data);
        if (href) {
          router.push(`${href}${href.includes("?") ? "&" : "?"}mode=renew`);
          return;
        }
        setError("Checkout session was not returned.");
      } catch (err) {
        setError(friendlyNetworkError(err, "Unable to start checkout."));
      }
    });
  }

  const tone =
    expiredLicense || subStatus === "expired"
      ? "danger"
      : subStatus === "trial" || subStatus === "trialing"
        ? "trial"
        : "warning";

  return (
    <div
      className={cn(
        "rounded-2xl border px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4",
        tone === "danger" && "border-rose-200 bg-rose-50",
        tone === "trial" && "border-sky-200 bg-sky-50",
        tone === "warning" && "border-amber-200 bg-amber-50"
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
          <CreditCard className="h-4 w-4 text-[var(--portal-primary)]" />
        </div>
        <div>
          <p className="font-semibold text-[var(--portal-fg)]">{title}</p>
          <p className="mt-0.5 text-sm text-[var(--portal-muted)]">{description}</p>
          {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
        </div>
      </div>
      <Button
        type="button"
        className="mt-4 shrink-0 rounded-xl sm:mt-0"
        disabled={pending}
        onClick={() => startCheckout()}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening checkout…
          </>
        ) : subStatus === "trial" || subStatus === "trialing" ? (
          "Pay & activate"
        ) : outstanding ? (
          "Pay bill"
        ) : (
          "Renew now"
        )}
      </Button>
    </div>
  );
}
