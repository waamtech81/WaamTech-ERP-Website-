"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { CheckCircle2, Clock3, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalPanel, PortalSkeleton } from "@/components/portal/portal-ui";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { authConfig } from "@/lib/auth/config";
import { markPortalEmailDeliveryNoticePending } from "@/lib/portal/email-delivery-notice";

function SuccessInner() {
  const { reload } = usePortalContext();
  const searchParams = useSearchParams();
  const mode = String(searchParams.get("mode") || "").trim();
  const planName = String(searchParams.get("plan") || "").trim();
  const awaitingReview = searchParams.get("review") === "1";
  const appUrl = authConfig.appUrl.replace(/\/+$/, "");

  useEffect(() => {
    void reload();
    // One-time dashboard email notice after checkout (predefined + custom).
    if (!awaitingReview) {
      markPortalEmailDeliveryNoticePending();
    }
  }, [reload, awaitingReview]);

  const isTrialConvert =
    mode === "trial-convert" || mode === "trial_convert";
  const isNewPlace = mode === "new_place" || mode === "add_place";
  const isRenew = mode === "renew";
  const isSignupPaid = mode === "signup" || mode === "signup_paid";

  const title = awaitingReview
    ? isSignupPaid
      ? "Payment submitted — under review"
      : "Payment proof received — under review"
    : isSignupPaid
      ? "Welcome — purchase complete"
      : isTrialConvert
        ? "Thank you — welcome to paid WAAMTO"
        : isNewPlace
          ? "New place activated"
          : "Payment complete";

  const description = awaitingReview
    ? "Finance is verifying your payment. Your license, subscription, and ERP workspace activate after approval. You can track status on the dashboard."
    : isSignupPaid
      ? "Your payment is confirmed. License Engine activates your license, commercial snapshot, entitlements, and ERP provisioning automatically."
      : isTrialConvert
        ? "Your trial account is now paid. The same license continues — check your email for the paid invoice and welcome message."
        : isNewPlace
          ? "Your new place subscription is recorded. License Engine updates the account; WAAMTO ERP Cloud shows it under multi-business after sync."
          : isRenew
            ? "Your subscription is active again. ERP access restores after license sync (usually within a minute)."
            : "Your renewal or upgrade completed successfully.";

  return (
    <PortalPanel title={title} description={description}>
      <div
        className={
          awaitingReview
            ? "mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
            : "mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800"
        }
      >
        {awaitingReview ? (
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        )}
        <div className="space-y-2 text-sm">
          {awaitingReview ? (
            <>
              <p>
                {planName
                  ? `Your payment for “${planName}” is queued for manual verification.`
                  : "Your payment proof is queued for manual verification."}
              </p>
              <p>
                Billing, subscriptions, and invoices will show as <strong>pending</strong> until
                Finance approves. You will receive email and portal notifications when activation
                completes.
              </p>
            </>
          ) : isTrialConvert ? (
            <>
              <p>
                {planName
                  ? `Plan “${planName}” is now active on your existing license.`
                  : "Your subscription is now active on your existing license."}
              </p>
              <p>
                We sent a <strong>paid invoice</strong> and <strong>welcome email</strong> to
                your account email. You can sign in to{" "}
                <a
                  href={`${appUrl}/login`}
                  className="font-semibold underline underline-offset-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  app.waamto.com
                </a>{" "}
                with the same license key.
              </p>
            </>
          ) : (
            <>
              <p>
                {planName
                  ? `Plan “${planName}” is now processing on this account.`
                  : "Subscription details will refresh in your portal shortly."}
              </p>
              {isNewPlace ? (
                <p>
                  Next on{" "}
                  <a
                    href={`${appUrl}/login`}
                    className="font-semibold underline underline-offset-2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    app.waamto.com
                  </a>
                  : open Multi-business → select the new place → complete Business Profile
                  Setup.
                </p>
              ) : (
                <p>
                  {isRenew
                    ? "Monthly or yearly billing continues from this payment date. Review invoices in this portal anytime."
                    : "If this was an upgrade, limits and modules sync to the same business in SaaS."}
                </p>
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {awaitingReview ? (
          <Button asChild className="rounded-xl">
            <Link href="/portal">Go to dashboard</Link>
          </Button>
        ) : (
          <Button asChild className="rounded-xl">
            <Link href="/portal/subscriptions">View subscriptions</Link>
          </Button>
        )}
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/portal/billing">Billing & payments</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <a href={`${appUrl}/login`} target="_blank" rel="noreferrer">
            Open WAAMTO app
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
        <Button asChild variant="ghost" className="rounded-xl">
          <Link href="/portal">Dashboard</Link>
        </Button>
      </div>
    </PortalPanel>
  );
}

export default function PortalCheckoutSuccessPage() {
  return (
    <Suspense fallback={<PortalSkeleton rows={1} />}>
      <SuccessInner />
    </Suspense>
  );
}
