import { fetchBillingGateways } from "@/lib/commercial/client";

/** Prefer a live online gateway; fall back to bank/manual; never force simulated in production. */
export async function resolvePreferredGateway(
  accessToken: string,
  requested?: string | null
): Promise<string> {
  const requestedId = String(requested || "").trim().toLowerCase();
  const gateways = await fetchBillingGateways(accessToken);
  const list = gateways.ok ? gateways.data : [];

  if (requestedId) {
    const match = list.find((g) => g.id === requestedId);
    if (match && (match.configured || match.online || match.id === "bank" || match.id === "manual")) {
      return match.id;
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
