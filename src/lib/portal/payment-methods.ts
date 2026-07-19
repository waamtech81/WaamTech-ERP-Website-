/**
 * Portal payment method catalog — geo-aware UI instructions.
 * Engine checkout gateways stay stripe|paypal|bank|manual|simulated;
 * Pakistan wallets / Wise map to bank|manual with a structured reference.
 */

export type PaymentMethodId =
  | "jazzcash"
  | "easypaisa"
  | "ufone"
  | "paypal"
  | "stripe"
  | "card"
  | "bank"
  | "wise";

export type PaymentMethodKind = "wallet" | "online" | "transfer";

export type PortalPaymentMethod = {
  id: PaymentMethodId;
  label: string;
  kind: PaymentMethodKind;
  /** Only show when visitor country is Pakistan */
  pakistanOnly?: boolean;
  /** Maps to License Engine checkout gateway */
  engineGateway: "stripe" | "paypal" | "bank" | "manual";
  /** Requires transaction / reference id before confirm */
  requiresTransactionId: boolean;
  shortHint: string;
};

export const PK_MOBILE_WALLET_ACCOUNT = "03002830192";
export const WISE_PAYMENT_ID = "atif.rehmani@gmail.com";
export const PAYPAL_RECEIVE_EMAIL = "atifrehmani@gmail.com";

/** Standard Chartered — override via NEXT_PUBLIC_SC_* env when details change. */
export function standardCharteredDetails() {
  return {
    bankName: "Standard Chartered Bank",
    accountTitle:
      process.env.NEXT_PUBLIC_SC_ACCOUNT_TITLE?.trim() || "Atif Rehmani",
    accountNumber:
      process.env.NEXT_PUBLIC_SC_ACCOUNT_NUMBER?.trim() ||
      "Configure NEXT_PUBLIC_SC_ACCOUNT_NUMBER",
    iban: process.env.NEXT_PUBLIC_SC_IBAN?.trim() || "",
    branch: process.env.NEXT_PUBLIC_SC_BRANCH?.trim() || "Pakistan",
    swift: process.env.NEXT_PUBLIC_SC_SWIFT?.trim() || "",
  };
}

export const PORTAL_PAYMENT_METHODS: PortalPaymentMethod[] = [
  {
    id: "jazzcash",
    label: "JazzCash",
    kind: "wallet",
    pakistanOnly: true,
    engineGateway: "manual",
    requiresTransactionId: true,
    shortHint: "Send to mobile wallet, then enter transaction ID",
  },
  {
    id: "easypaisa",
    label: "EasyPaisa",
    kind: "wallet",
    pakistanOnly: true,
    engineGateway: "manual",
    requiresTransactionId: true,
    shortHint: "Send to mobile wallet, then enter transaction ID",
  },
  {
    id: "ufone",
    label: "Ufone Money",
    kind: "wallet",
    pakistanOnly: true,
    engineGateway: "manual",
    requiresTransactionId: true,
    shortHint: "Send to mobile wallet, then enter transaction ID",
  },
  {
    id: "paypal",
    label: "PayPal",
    // Email/receive flow + transaction ID (not REST webhook checkout).
    kind: "transfer",
    engineGateway: "manual",
    requiresTransactionId: true,
    shortHint: "Pay via PayPal, then paste the transaction ID",
  },
  {
    id: "stripe",
    label: "Stripe / card",
    kind: "online",
    engineGateway: "stripe",
    requiresTransactionId: false,
    shortHint: "Card checkout when Stripe is configured on License Engine",
  },
  {
    id: "card",
    label: "Bank card",
    kind: "online",
    engineGateway: "stripe",
    requiresTransactionId: false,
    shortHint: "Debit / credit card via Stripe when available",
  },
  {
    id: "bank",
    label: "Standard Chartered (bank transfer)",
    kind: "transfer",
    engineGateway: "bank",
    requiresTransactionId: true,
    shortHint: "Transfer to bank account, then enter transaction ID",
  },
  {
    id: "wise",
    label: "Wise",
    kind: "transfer",
    engineGateway: "manual",
    requiresTransactionId: true,
    shortHint: "Send to Wise payment ID, then enter transaction ID",
  },
];

export function isPakistanCountry(country: string | null | undefined): boolean {
  const c = String(country || "")
    .trim()
    .toUpperCase();
  return c === "PK" || c === "PAK" || c === "PAKISTAN";
}

export function paymentMethodsForCountry(
  country: string | null | undefined
): PortalPaymentMethod[] {
  const pk = isPakistanCountry(country);
  return PORTAL_PAYMENT_METHODS.filter((m) => (m.pakistanOnly ? pk : true));
}

/** Map UI method → Engine gateway id for checkout create. */
export function engineGatewayForMethod(methodId: string | null | undefined): string {
  const id = String(methodId || "")
    .trim()
    .toLowerCase();
  const method = PORTAL_PAYMENT_METHODS.find((m) => m.id === id);
  if (method) return method.engineGateway;
  if (["stripe", "paypal", "bank", "manual", "simulated"].includes(id)) return id;
  return "bank";
}

export function buildPaymentReference(input: {
  methodId: string;
  transactionId: string;
  amount?: number | null;
  currency?: string | null;
}): string {
  const method = String(input.methodId || "manual").trim().toLowerCase();
  const txn = String(input.transactionId || "").trim();
  const parts = [`method=${method}`, `txn=${txn}`];
  if (input.amount != null) parts.push(`amount=${input.amount}`);
  if (input.currency) parts.push(`currency=${input.currency}`);
  return parts.join("|").slice(0, 240);
}

export function walletTransferMessage(methodLabel: string): string {
  return `Send the exact bill amount to ${methodLabel} (or JazzCash / EasyPaisa / Ufone Money) using account number ${PK_MOBILE_WALLET_ACCOUNT}. After the transfer succeeds, enter the transaction ID below and submit — License Engine will record the payment and notify your account.`;
}

export function paypalCheckoutUrl(amount?: number | null, currency?: string | null): string {
  const params = new URLSearchParams({
    cmd: "_xclick",
    business: PAYPAL_RECEIVE_EMAIL,
    currency_code: (currency || "USD").toUpperCase(),
    item_name: "WAAMTO ERP Cloud subscription",
  });
  if (amount != null && Number.isFinite(Number(amount))) {
    params.set("amount", String(Number(amount).toFixed(2)));
  }
  return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
}
