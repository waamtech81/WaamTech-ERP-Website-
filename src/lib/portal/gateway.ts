import { fetchBillingGateways } from "@/lib/commercial/client";
import { engineGatewayForMethod } from "@/lib/portal/payment-methods";
import { paypalEnabled } from "@/lib/paypal/client";

type EngineGateway = { id: string; configured?: boolean; online?: boolean };

function engineHasPaypal(list: EngineGateway[]): boolean {
  const paypal = list.find((g) => g.id === "paypal");
  return Boolean(paypal && (paypal.configured || paypal.online));
}

function engineManualOrBank(list: EngineGateway[]): string {
  return (
    list.find((g) => g.id === "manual")?.id ||
    list.find((g) => g.id === "bank")?.id ||
    "manual"
  );
}

/**
 * Website PayPal REST runs on waamto-website; License Engine checkout may not
 * expose PayPal as a configured gateway. Use an Engine-accepted gateway for the
 * checkout session/confirm while the UI still collects via PayPal.
 */
export function resolveWebsitePayPalEngineGateway(
  list: EngineGateway[]
): string {
  if (engineHasPaypal(list)) return "paypal";
  return engineManualOrBank(list);
}

/** Prefer a live online gateway; fall back to bank/manual; never force simulated in production. */
export async function resolvePreferredGateway(
  accessToken: string,
  requested?: string | null
): Promise<string> {
  const requestedId = engineGatewayForMethod(requested);
  const gateways = await fetchBillingGateways(accessToken);
  const list = gateways.ok ? gateways.data : [];

  // Website-side PayPal REST — honour PayPal in UI; map to Engine gateway for checkout session.
  if (requestedId === "paypal" && paypalEnabled()) {
    return resolveWebsitePayPalEngineGateway(list);
  }

  if (requestedId) {
    const match = list.find((g) => g.id === requestedId);
    if (match && (match.configured || match.online || match.id === "bank" || match.id === "manual")) {
      return match.id;
    }
    // Portal wallets / Wise always settle via manual or bank even if not listed.
    if (["bank", "manual"].includes(requestedId)) {
      return requestedId;
    }
    if (requestedId === "simulated" && process.env.NODE_ENV !== "production") {
      return "simulated";
    }
  }

  const online = list.find((g) => g.online && g.configured && g.id !== "simulated");
  if (online) return online.id;

  const configured = list.find(
    (g) => g.configured && ["stripe", "paypal", "bank", "manual"].includes(g.id)
  );
  if (configured) return configured.id;

  const bank = list.find((g) => g.id === "bank" || g.id === "manual");
  if (bank) return bank.id;

  if (process.env.NODE_ENV !== "production") return "simulated";
  return "bank";
}
