import type { PortalDashboard } from "@/lib/portal/dashboard";
import type { CommercialSubscription } from "@/lib/commercial/types";

export type PortalBillingGateReason =
  | "trial_expired"
  | "subscription_expired"
  | "subscription_suspended";

export type PortalBillingGate = {
  required: boolean;
  reason: PortalBillingGateReason | null;
  mode: "trial-convert" | "renew";
  subscriptionId: string | null;
  licenseId: string | null;
  planId: string | null;
  billingCycle: string;
  planName: string | null;
  title: string;
  message: string;
};

function norm(value?: string | null): string {
  return String(value || "").trim().toLowerCase();
}

function pickSubscription(subs: CommercialSubscription[]): CommercialSubscription | null {
  if (!subs.length) return null;
  const preferred = subs.find((s) =>
    ["trial", "trialing", "active", "grace", "expired", "suspended", "pending"].includes(
      norm(s.status)
    )
  );
  return preferred || subs[0] || null;
}

function isTrialContext(
  sub: CommercialSubscription | null,
  license?: PortalDashboard["licenses"][number] | null
): boolean {
  if (sub?.trial_ends_at) return true;
  if (norm(sub?.status) === "trial" || norm(sub?.status) === "trialing") return true;
  if (norm(license?.plan_type) === "trial") return true;
  if (norm(license?.status) === "trial") return true;
  return false;
}

function periodEnded(
  sub: CommercialSubscription | null,
  license?: PortalDashboard["licenses"][number] | null
): boolean {
  const endsAt =
    sub?.trial_ends_at ||
    sub?.expiry_date ||
    sub?.renewal_date ||
    license?.expiry_date ||
    null;
  if (endsAt) {
    const end = new Date(String(endsAt));
    if (!Number.isNaN(end.getTime()) && end.getTime() < Date.now()) return true;
  }
  if (typeof license?.days_remaining === "number" && license.days_remaining < 0) {
    return true;
  }
  return false;
}

export function resolvePortalBillingGate(data: PortalDashboard | null): PortalBillingGate {
  const empty: PortalBillingGate = {
    required: false,
    reason: null,
    mode: "renew",
    subscriptionId: null,
    licenseId: null,
    planId: null,
    billingCycle: "yearly",
    planName: null,
    title: "",
    message: "",
  };
  if (!data) return empty;

  const sub = pickSubscription(data.subscriptions || []);
  const license = data.licenses?.[0] || null;
  const licStatus = norm(license?.effective_status || license?.status);
  const subStatus = norm(sub?.status);
  const engineTrial = (data.engineDashboard?.trial || null) as
    | { expired?: boolean }
    | null;
  const trialExpiredEngine = engineTrial?.expired === true;
  const trialCtx = isTrialContext(sub, license);
  const ended = trialExpiredEngine || periodEnded(sub, license);

  if (
    trialCtx &&
    (trialExpiredEngine ||
      ended ||
      licStatus === "expired" ||
      subStatus === "expired" ||
      subStatus === "suspended")
  ) {
    const cycle = sub?.billing_cycle || license?.billing_cycle || "monthly";
    return {
      required: true,
      reason: "trial_expired",
      mode: "trial-convert",
      subscriptionId: sub?.id || null,
      licenseId: license?.id || sub?.license_id || null,
      planId: sub?.plan_id || null,
      billingCycle: cycle,
      planName: sub?.plan_name || license?.plan_name || data.subscription?.currentPlan || null,
      title: "Trial ended",
      message:
        "Your free trial has ended. Complete payment to keep the same license, modules, and business profile active on WAAMTO ERP Cloud.",
    };
  }

  if (
    !trialCtx &&
    (["expired", "suspended"].includes(licStatus) || ["expired", "suspended"].includes(subStatus))
  ) {
    const cycle = sub?.billing_cycle || license?.billing_cycle || "yearly";
    return {
      required: true,
      reason:
        subStatus === "suspended" || licStatus === "suspended"
          ? "subscription_suspended"
          : "subscription_expired",
      mode: "renew",
      subscriptionId: sub?.id || null,
      licenseId: license?.id || sub?.license_id || null,
      planId: sub?.plan_id || null,
      billingCycle: cycle,
      planName: sub?.plan_name || license?.plan_name || data.subscription?.currentPlan || null,
      title: "Subscription payment required",
      message:
        "Your paid subscription period ended without renewal. Pay now to restore WAAMTO ERP Cloud access. You can still manage billing here in the portal.",
    };
  }

  return empty;
}
