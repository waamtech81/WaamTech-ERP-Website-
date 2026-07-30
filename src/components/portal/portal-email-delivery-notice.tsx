"use client";

import { useEffect, useState } from "react";
import { Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  dismissPortalEmailDeliveryNotice,
  shouldShowPortalEmailDeliveryNotice,
} from "@/lib/portal/email-delivery-notice";

/**
 * Centered one-time modal on portal dashboard after first checkout / trial signup.
 * Predefined and Custom ERP — same message. Close = never again.
 */
export function PortalEmailDeliveryNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(shouldShowPortalEmailDeliveryNotice());
  }, []);

  function handleClose() {
    dismissPortalEmailDeliveryNotice();
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-email-notice-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 shadow-xl">
        <button
          type="button"
          onClick={handleClose}
          className="portal-focus-ring absolute right-3 top-3 rounded-lg p-1.5 text-[var(--portal-muted)] transition hover:bg-[var(--portal-soft)] hover:text-[var(--portal-fg)]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]">
          <Mail className="h-6 w-6" />
        </div>

        <h2
          id="portal-email-notice-title"
          className="pr-8 text-lg font-semibold text-[var(--portal-fg)]"
        >
          Check your email
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--portal-muted)]">
          We have sent your <strong className="text-[var(--portal-fg)]">license details</strong>,{" "}
          <strong className="text-[var(--portal-fg)]">invoice</strong>,{" "}
          <strong className="text-[var(--portal-fg)]">username</strong>, and account information
          to your registered email address.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--portal-muted)]">
          Please keep an eye on your inbox. If you do not see the message within a few minutes,
          also check your <strong className="text-[var(--portal-fg)]">Spam</strong> and{" "}
          <strong className="text-[var(--portal-fg)]">Junk</strong> folders.
        </p>

        <div className="mt-6 flex justify-end">
          <Button type="button" className="rounded-xl" onClick={handleClose}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
