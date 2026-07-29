"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Loader2,
  PauseCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalStatusBadge } from "@/components/portal/portal-ui";
import type { PortalDashboard } from "@/lib/portal/dashboard";
import { showRenewalUi } from "@/lib/portal/package-type";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";
import { portalCheckoutHref } from "@/lib/portal/checkout-session";
import { cn } from "@/lib/utils";

type StatusKind =
  | "pending_payment"
  | "payment_under_review"
  | "active"
  | "suspended"
  | "expired"
  | "trial"
  | "renewal_due"
  | "outstanding";

type StatusCard = {
  kind: StatusKind;
  title: string;
  status: string;
  message: string;
  level: "info" | "success" | "warning" | "danger";
  actionLabel?: string;
  /** Prefer client navigation for checkout tokens. */
  onAction?: () => void;
  actionHref?: string;
  actionPending?: boolean;
};

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

function toneClasses(level: StatusCard["level"]) {
  if (level === "danger") return "border-rose-200 bg-rose-50";
  if (level === "warning") return "border-amber-200 bg-amber-50";
  if (level === "success") return "border-emerald-200 bg-emerald-50";
  return "border-sky-200 bg-sky-50";
}

function StatusIcon({ kind }: { kind: StatusKind }) {
  const className = "h-4 w-4 text-[var(--portal-primary)]";
  if (kind === "active") return <CheckCircle2 className={className} />;
  if (kind === "suspended") return <PauseCircle className={className} />;
  if (kind === "expired" || kind === "outstanding") {
    return <AlertTriangle className={className} />;
  }
  if (kind === "payment_under_review" || kind === "trial" || kind === "renewal_due") {
    return <Clock className={className} />;
  }
  return <CreditCard className={className} />;
}

function resolveStatusCard(
  data: PortalDashboard,
  opts: {
    startRenewCheckout: () => void;
    renewPending: boolean;
    openSignupCheckout: (token: string) => void;
  }
): StatusCard | null {
  const pendingCheckout = data.pendingCheckout;
  const pendingStatus = String(pendingCheckout?.status || "").toLowerCase();
  const underReview = pendingStatus === "awaiting_confirmation";
  const hasPendingCheckout = Boolean(pendingCheckout?.session_token);
  const noLicenses = !data.licenses?.length;

  // 1) Paid signup — payment submitted, awaiting admin confirmation
  if (hasPendingCheckout && underReview) {
    const amountLabel =
      pendingCheckout && pendingCheckout.amount > 0
        ? `${pendingCheckout.currency} ${Number(pendingCheckout.amount).toFixed(2)}`
        : null;
    return {
      kind: "payment_under_review",
      title: "Payment under review",
      status: "Awaiting approval",
      message: amountLabel
        ? `We received your payment proof (${amountLabel}). License, modules, and ERP activate automatically after approval — no further action needed.`
        : "We received your payment proof. License, modules, and ERP activate automatically after approval — no further action needed.",
      level: "warning",
      actionLabel: "View checkout status",
      onAction: () => opts.openSignupCheckout(pendingCheckout!.session_token),
    };
  }

  // 2) Paid signup — checkout still open
  if (hasPendingCheckout && (noLicenses || pendingStatus === "open" || pendingStatus === "pending")) {
    const amountLabel =
      pendingCheckout && pendingCheckout.amount > 0
        ? `${pendingCheckout.currency} ${Number(pendingCheckout.amount).toFixed(2)}`
        : null;
    return {
      kind: "pending_payment",
      title: "Pending payment",
      status: "Action required",
      message: amountLabel
        ? `Complete checkout (${amountLabel}) to activate your license, entitlements, and ERP workspace.`
        : "Complete checkout to activate your license, entitlements, and ERP workspace.",
      level: "danger",
      actionLabel: "Continue checkout",
      onAction: () => opts.openSignupCheckout(pendingCheckout!.session_token),
    };
  }

  const sub =
    data.subscriptions?.find((s) =>
      ["active", "trial", "trialing", "grace", "suspended", "expired", "pending"].includes(
        String(s.status || "").toLowerCase()
      )
    ) || data.subscriptions?.[0];

  const subStatus = String(sub?.status || data.subscription?.status || "").toLowerCase();
  const notice = data.accessNotice;
  const noticeStatus = String(notice?.status || "").toLowerCase();
  const planName = data.subscription?.currentPlan || sub?.plan_name;
  const billingCycle = sub?.billing_cycle || data.licenses?.[0]?.billing_cycle;
  const canRenew = showRenewalUi(billingCycle);
  const trialDays = data.subscription?.trialRemainingDays;
  const outstanding = data.billing?.outstandingBalance;

  const expiredLicense = data.licenses.some((l) => {
    const st = String(l.effective_status || l.status || "").toLowerCase();
    return st === "expired" || (l.expired && !l.in_grace);
  });
  const suspendedLicense = data.licenses.some((l) => {
    const st = String(l.effective_status || l.status || "").toLowerCase();
    return st.includes("suspend");
  });
  const expiringSoon = data.licenses.some(
    (l) => typeof l.days_remaining === "number" && l.days_remaining >= 0 && l.days_remaining <= 14
  );

  const isSuspended =
    suspendedLicense ||
    subStatus === "suspended" ||
    noticeStatus.includes("suspend") ||
    Boolean(notice?.title?.toLowerCase().includes("suspend"));

  const isExpired =
    expiredLicense ||
    subStatus === "expired" ||
    noticeStatus.includes("expir") ||
    Boolean(notice?.title?.toLowerCase().includes("expir")) ||
    Boolean(notice?.title?.toLowerCase().includes("trial ended"));

  // 3) Suspended
  if (isSuspended) {
    return {
      kind: "suspended",
      title: "Suspended",
      status: "Access limited",
      message:
        notice?.message ||
        "Your license is suspended. Review billing and renew to restore full access.",
      level: "warning",
      actionLabel: canRenew && sub?.id ? "Continue checkout" : notice?.actionLabel || "View payment status",
      onAction: canRenew && sub?.id ? opts.startRenewCheckout : undefined,
      actionHref:
        canRenew && sub?.id
          ? undefined
          : notice?.actionHref || "/portal/billing",
      actionPending: opts.renewPending,
    };
  }

  // 4) Expired / trial ended
  if (isExpired) {
    const trialEnded =
      noticeStatus.includes("trial") ||
      Boolean(notice?.title?.toLowerCase().includes("trial"));
    return {
      kind: "expired",
      title: "Expired",
      status: trialEnded ? "Trial ended" : "Renewal required",
      message:
        notice?.message ||
        "Your subscription has expired. Renew now to restore portal and ERP access.",
      level: "danger",
      actionLabel: canRenew && sub?.id ? "Continue checkout" : notice?.actionLabel || "View payment status",
      onAction: canRenew && sub?.id ? opts.startRenewCheckout : undefined,
      actionHref:
        canRenew && sub?.id
          ? undefined
          : notice?.actionHref || "/portal/billing",
      actionPending: opts.renewPending,
    };
  }

  // 5) Outstanding balance
  if (outstanding && sub?.id && canRenew) {
    return {
      kind: "outstanding",
      title: "Pending payment",
      status: "Balance due",
      message: `Amount due: ${outstanding}. Complete checkout to clear your balance.`,
      level: "danger",
      actionLabel: "Continue checkout",
      onAction: opts.startRenewCheckout,
      actionPending: opts.renewPending,
    };
  }

  // 6) Trial (active trial — encourage activation)
  if (
    (subStatus === "trial" || subStatus === "trialing") &&
    sub?.id &&
    canRenew
  ) {
    return {
      kind: "trial",
      title: "Active",
      status: "Trial",
      message:
        trialDays != null
          ? `Your trial is active${planName ? ` on ${planName}` : ""}. ${trialDays} day${trialDays === 1 ? "" : "s"} remaining — pay now to continue without interruption.`
          : `Your trial is active${planName ? ` on ${planName}` : ""}. Pay now to continue without interruption.`,
      level: "info",
      actionLabel: "Continue checkout",
      onAction: opts.startRenewCheckout,
      actionPending: opts.renewPending,
    };
  }

  // 7) Renewal due soon
  if (expiringSoon && sub?.id && canRenew) {
    return {
      kind: "renewal_due",
      title: "Active",
      status: "Renewal due soon",
      message: planName
        ? `${planName} is renewing soon. Pay now to avoid interruption.`
        : "Your license is renewing soon. Pay now to avoid interruption.",
      level: "warning",
      actionLabel: "Continue checkout",
      onAction: opts.startRenewCheckout,
      actionPending: opts.renewPending,
    };
  }

  // 8) Other access notices (non-duplicate commercial states)
  if (notice) {
    const st = noticeStatus;
    if (st.includes("pending payment") || st === "pending") {
      return {
        kind: "pending_payment",
        title: "Pending payment",
        status: "Action required",
        message: notice.message,
        level: notice.level === "danger" ? "danger" : "warning",
        actionLabel: notice.actionLabel || "Continue checkout",
        actionHref: notice.actionHref || "/portal/billing",
      };
    }
    if (st.includes("under review") || st.includes("awaiting")) {
      return {
        kind: "payment_under_review",
        title: "Payment under review",
        status: "Awaiting approval",
        message: notice.message,
        level: "warning",
        actionLabel: notice.actionLabel || "View checkout status",
        actionHref: notice.actionHref || "/portal/checkout?mode=signup",
      };
    }
    return {
      kind: "renewal_due",
      title: notice.title,
      status: notice.status,
      message: notice.message,
      level:
        notice.level === "danger"
          ? "danger"
          : notice.level === "warning"
            ? "warning"
            : "info",
      actionLabel: notice.actionLabel,
      actionHref: notice.actionHref,
    };
  }

  // 9) Healthy active account — single calm status card
  const usable = data.licenses.some((l) => {
    const st = String(l.effective_status || l.status || "").toLowerCase();
    return ["active", "trial", "trialing", "grace"].includes(st);
  });
  if (usable || subStatus === "active" || subStatus === "grace") {
    return {
      kind: "active",
      title: "Active",
      status: "In good standing",
      message: planName
        ? `${planName} is active. License entitlements and ERP access are in good standing.`
        : "Your license entitlements and ERP access are in good standing.",
      level: "success",
      actionLabel: "View payment status",
      actionHref: "/portal/billing",
    };
  }

  return null;
}

/** Single dashboard status card — one purchase/access state, one action. */
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

  function openSignupCheckout(token: string) {
    router.push(portalCheckoutHref("signup", token));
  }

  function startRenewCheckout() {
    if (!sub?.id) return;
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

  const card = resolveStatusCard(data, {
    startRenewCheckout,
    renewPending: pending,
    openSignupCheckout,
  });

  if (!card) return null;

  return (
    <div
      role="status"
      className={cn(
        "rounded-2xl border px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4",
        toneClasses(card.level)
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
          <StatusIcon kind={card.kind} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-[var(--portal-fg)]">{card.title}</p>
            <PortalStatusBadge status={card.status} />
          </div>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">{card.message}</p>
          {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
        </div>
      </div>

      {card.onAction || card.actionHref ? (
        card.onAction ? (
          <Button
            type="button"
            className="mt-4 shrink-0 rounded-xl sm:mt-0"
            disabled={Boolean(card.actionPending)}
            onClick={() => card.onAction?.()}
          >
            {card.actionPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening checkout…
              </>
            ) : (
              card.actionLabel || "Continue"
            )}
          </Button>
        ) : card.actionHref ? (
          <Button asChild className="mt-4 shrink-0 rounded-xl sm:mt-0">
            <Link href={card.actionHref}>{card.actionLabel || "Continue"}</Link>
          </Button>
        ) : null
      ) : null}
    </div>
  );
}
