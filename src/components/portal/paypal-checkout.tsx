"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

// Minimal PayPal SDK types for what we use
interface PayPalButtonsComponent {
  render: (container: HTMLElement) => Promise<void>;
  close: () => Promise<void>;
}

interface PayPalNamespace {
  Buttons: (config: {
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onError?: (err: unknown) => void;
    onCancel?: () => void;
    style?: {
      color?: "gold" | "blue" | "silver" | "white" | "black";
      shape?: "rect" | "pill";
      label?: "paypal" | "checkout" | "buynow" | "pay";
      height?: number;
    };
  }) => PayPalButtonsComponent;
}

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

type PayPalCheckoutState = "loading" | "ready" | "processing" | "error" | "cancelled";

type Props = {
  sessionToken: string;
  amount: number;
  currency: string;
  mode?: string;
  planName?: string;
  onError?: (msg: string) => void;
};

export function PayPalCheckout({
  sessionToken,
  amount,
  currency,
  mode,
  planName,
  onError,
}: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonsInstanceRef = useRef<PayPalButtonsComponent | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const mountedRef = useRef(true);

  const [status, setStatus] = useState<PayPalCheckoutState>("loading");
  const [localError, setLocalError] = useState("");
  const [clientId, setClientId] = useState("");

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Step 1: fetch our server-side client ID
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/paypal/config", { cache: "no-store" });
        const json = await res.json();
        if (cancelled || !mountedRef.current) return;
        if (!json.data?.client_id) {
          setLocalError("PayPal is not available. Please choose another payment method.");
          setStatus("error");
          return;
        }
        setClientId(String(json.data.client_id));
      } catch {
        if (!cancelled && mountedRef.current) {
          setLocalError("Could not load PayPal. Please refresh and try again.");
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const renderButtons = useCallback(async () => {
    if (!mountedRef.current || !containerRef.current || !window.paypal) return;

    // Close any previous instance
    if (buttonsInstanceRef.current) {
      try {
        await buttonsInstanceRef.current.close();
      } catch {
        /* ignore */
      }
      buttonsInstanceRef.current = null;
    }

    containerRef.current.innerHTML = "";

    const buttons = window.paypal.Buttons({
      style: { color: "gold", shape: "rect", label: "pay", height: 48 },

      createOrder: async () => {
        if (!mountedRef.current) throw new Error("Component unmounted.");
        setStatus("processing");
        setLocalError("");

        const res = await fetch("/api/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({ session_token: sessionToken }),
        });
        const json = await res.json();

        if (!json.success || !json.data?.order_id) {
          const msg = String(json.message || "Failed to create PayPal order.");
          if (mountedRef.current) {
            setLocalError(msg);
            setStatus("ready");
          }
          onError?.(msg);
          throw new Error(msg);
        }
        return String(json.data.order_id);
      },

      onApprove: async (data) => {
        if (!mountedRef.current) return;
        setStatus("processing");
        setLocalError("");

        try {
          const res = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            cache: "no-store",
            body: JSON.stringify({
              order_id: data.orderID,
              session_token: sessionToken,
            }),
          });
          const json = await res.json();

          if (!json.success) {
            const msg = String(json.message || "Payment capture failed.");
            if (mountedRef.current) {
              setLocalError(msg);
              setStatus("ready");
            }
            onError?.(msg);
            return;
          }

          const qs = new URLSearchParams({ session: sessionToken });
          if (mode) qs.set("mode", mode);
          if (planName) qs.set("plan", planName);
          router.replace(`/portal/checkout/success?${qs.toString()}`);
        } catch {
          if (mountedRef.current) {
            const msg = "Payment processing failed. Please try again.";
            setLocalError(msg);
            setStatus("ready");
            onError?.(msg);
          }
        }
      },

      onError: (err) => {
        console.error("[PayPal]", err);
        const msg =
          "PayPal encountered an error. Please try again or choose another payment method.";
        if (mountedRef.current) {
          setLocalError(msg);
          setStatus("ready");
        }
        onError?.(msg);
      },

      onCancel: () => {
        if (mountedRef.current) {
          setStatus("cancelled");
          setLocalError("");
        }
      },
    });

    buttonsInstanceRef.current = buttons;
    await buttons.render(containerRef.current);
    if (mountedRef.current) setStatus("ready");
  }, [sessionToken, mode, planName, onError, router]);

  // Step 2: inject PayPal SDK script
  useEffect(() => {
    if (!clientId) return;
    if (scriptRef.current) return; // already injecting

    // If SDK already loaded (cached), just render
    if (window.paypal) {
      renderButtons();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency.toUpperCase()}&intent=capture&components=buttons`;
    script.async = true;
    script.onload = () => {
      if (mountedRef.current) renderButtons();
    };
    script.onerror = () => {
      if (mountedRef.current) {
        setLocalError(
          "Failed to load PayPal SDK. Check your connection and refresh."
        );
        setStatus("error");
      }
    };
    document.head.appendChild(script);
    scriptRef.current = script;

    return () => {
      // Do NOT remove the script on cleanup — PayPal SDK should stay loaded
      // to avoid re-downloading. Removing it causes "paypal is not defined".
    };
  }, [clientId, currency, renderButtons]);

  // Cleanup buttons on unmount
  useEffect(() => {
    return () => {
      if (buttonsInstanceRef.current) {
        try {
          buttonsInstanceRef.current.close();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const isLoading = status === "loading" || (status === "processing" && !localError);

  return (
    <div className="space-y-3">
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-[var(--portal-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          {status === "processing" ? "Processing payment…" : "Loading PayPal…"}
        </div>
      )}

      {status === "cancelled" && !localError && (
        <p className="text-sm text-[var(--portal-muted)]">
          Payment cancelled — click the button below to try again.
        </p>
      )}

      {localError && status === "error" ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{localError}</span>
        </div>
      ) : localError ? (
        <p className="text-sm text-red-600">{localError}</p>
      ) : null}

      {/* PayPal SDK renders into this container */}
      <div
        ref={containerRef}
        className={status === "error" ? "hidden" : ""}
        style={{ minHeight: isLoading ? 0 : 52 }}
      />

      <p className="text-xs text-[var(--portal-muted)]">
        Pay with your PayPal account or a debit / credit card via PayPal&#39;s
        secure checkout. You will not be charged until you confirm on PayPal.
      </p>
    </div>
  );
}
