"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import {
  portalCheckoutHref,
  readCheckoutSessionToken,
} from "@/lib/portal/checkout-session";

const SKIP_PREFIXES = ["/portal/checkout", "/portal/settings"];

function hasActivatableLicense(
  licenses: { effective_status?: string | null; status?: string | null }[] | undefined
): boolean {
  return (licenses || []).some((l) => {
    const st = String(l.effective_status || l.status || "").toLowerCase();
    return ["active", "trial", "trialing", "grace", "pending"].includes(st);
  });
}

/**
 * After lifetime / custom ERP signup + OTP, checkout token lives in sessionStorage.
 * Send the customer to portal checkout (not signup page) once they land in the portal.
 */
export function PortalSignupCheckoutGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { data, loading } = usePortalContext();
  const startedRef = useRef(false);

  useEffect(() => {
    if (loading || !data || startedRef.current) return;
    if (
      SKIP_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
      )
    ) {
      return;
    }

    const token = readCheckoutSessionToken();
    if (!token || hasActivatableLicense(data.licenses)) return;

    startedRef.current = true;
    router.replace(portalCheckoutHref("signup"));
  }, [data, loading, pathname, router]);

  return null;
}
