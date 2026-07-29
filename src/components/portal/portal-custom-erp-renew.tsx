"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";
import { cn } from "@/lib/utils";
import { portalCheckoutHref } from "@/lib/portal/checkout-session";

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

/** Starts License Engine renewal checkout for Custom ERP subscriptions. */
export function PortalCustomErpRenewButton({
  subscriptionId,
  label = "Renew now",
  variant = "default",
  size = "sm",
  className,
}: {
  subscriptionId?: string | null;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default";
  className?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!subscriptionId) return null;

  function renew() {
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/portal/billing/renew", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({ subscription_id: subscriptionId }),
        });
        const json = await res.json();
        if (!json.success) {
          setError(apiMessageFromJson(json, "Unable to start renewal checkout."));
          return;
        }
        const href = checkoutHrefFromPayload(json.data);
        if (href) {
          router.push(`${href}${href.includes("?") ? "&" : "?"}mode=renew`);
          return;
        }
        setError("Renewal checkout did not return a session.");
      } catch (err) {
        setError(friendlyNetworkError(err));
      }
    });
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        size={size}
        variant={variant}
        className={cn("rounded-xl", className)}
        disabled={pending}
        onClick={() => renew()}
      >
        {pending ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            Starting checkout…
          </>
        ) : (
          label
        )}
      </Button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
