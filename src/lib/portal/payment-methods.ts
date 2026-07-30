/**
 * Portal payment method catalog — geo-aware UI instructions.
 * Engine checkout gateways stay stripe|paypal|bank|manual|simulated;
 * Pakistan wallets / Wise map to bank|manual with a structured reference.
 */

export type PaymentMethodId =
  | "jazzcash"
  | "easypaisa"
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
export const EASYPAYSA_IBAN = "PK94TMFB0000000045745494";
export const WISE_PAYMENT_ID = "atif.rehmani@gmail.com";
export const PAYPAL_RECEIVE_EMAIL = "atifrehmani@gmail.com";

/** Direct bank transfer — override via NEXT_PUBLIC_SC_* env when details change. */
export function standardCharteredDetails() {
  return {
    bankName: process.env.NEXT_PUBLIC_SC_BANK_NAME?.trim() || "Askari Bank",
    accountTitle:
      process.env.NEXT_PUBLIC_SC_ACCOUNT_TITLE?.trim() || "WAAMTECH",
    accountNumber:
      process.env.NEXT_PUBLIC_SC_ACCOUNT_NUMBER?.trim() || "1150420000732",
    iban: process.env.NEXT_PUBLIC_SC_IBAN?.trim() || "PK81ASCM0001150420000732",
    branch:
      process.env.NEXT_PUBLIC_SC_BRANCH?.trim() || "Kamran Center Branch, ISB-PK",
    swift: process.env.NEXT_PUBLIC_SC_SWIFT?.trim() || "ASCMPKKA",
  };
}

export type PortalPaymentMethodConfig = {
  bank: {
    bank_name: string;
    account_title: string;
    account_number: string;
    iban: string;
    swift: string;
    branch: string;
    currency: string;
    instructions: string | null;
  };
  jazzcash: { account_number: string };
  easypaisa: { iban: string };
  wise: { payment_id: string };
  paypal: { receive_email: string };
};

export function resolvePortalPaymentMethodConfig(
  fromEngine?: Partial<PortalPaymentMethodConfig> | null
): PortalPaymentMethodConfig {
  const bank = fromEngine?.bank;
  const jazzcash = fromEngine?.jazzcash;
  const easypaisa = fromEngine?.easypaisa;
  const wise = fromEngine?.wise;
  const paypal = fromEngine?.paypal;
  const fallbackBank = standardCharteredDetails();
  return {
    bank: {
      bank_name: bank?.bank_name || fallbackBank.bankName,
      account_title: bank?.account_title || fallbackBank.accountTitle,
      account_number: bank?.account_number || fallbackBank.accountNumber,
      iban: bank?.iban || fallbackBank.iban,
      swift: bank?.swift || fallbackBank.swift,
      branch: bank?.branch || fallbackBank.branch,
      currency: bank?.currency || "PKR",
      instructions: bank?.instructions ?? null,
    },
    jazzcash: {
      account_number: jazzcash?.account_number || PK_MOBILE_WALLET_ACCOUNT,
    },
    easypaisa: {
      iban: easypaisa?.iban || EASYPAYSA_IBAN,
    },
    wise: {
      payment_id: wise?.payment_id || WISE_PAYMENT_ID,
    },
    paypal: {
      receive_email: paypal?.receive_email || PAYPAL_RECEIVE_EMAIL,
    },
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
    shortHint: "Transfer to IBAN, then enter transaction ID",
  },
  {
    id: "paypal",
    label: "PayPal",
    kind: "online",
    engineGateway: "paypal",
    requiresTransactionId: false,
    shortHint: "Pay with PayPal account or debit / credit card via PayPal",
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
    label: "Debit/Credit Card",
    kind: "online",
    engineGateway: "stripe",
    requiresTransactionId: false,
    shortHint: "Pay with debit or credit card when Stripe is available",
  },
  {
    id: "bank",
    label: "Direct Bank Transfer",
    kind: "transfer",
    pakistanOnly: true,
    engineGateway: "bank",
    requiresTransactionId: true,
    shortHint: "Transfer to our bank account, then enter transaction ID",
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
  return PORTAL_PAYMENT_METHODS.filter((m) => !m.pakistanOnly || pk);
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

export function jazzcashTransferMessage(accountNumber = PK_MOBILE_WALLET_ACCOUNT): string {
  return `Send the exact bill amount to JazzCash using account number ${accountNumber}. After the transfer succeeds, enter the transaction ID below and submit — License Engine will record the payment and notify your account.`;
}

export function easypaisaTransferMessage(iban = EASYPAYSA_IBAN): string {
  return `Send the exact bill amount via EasyPaisa bank transfer using IBAN ${iban}. After the transfer succeeds, enter the transaction ID below and submit — License Engine will record the payment and notify your account.`;
}

/** @deprecated Use jazzcashTransferMessage or easypaisaTransferMessage */
export function walletTransferMessage(methodLabel: string): string {
  if (/easypaisa/i.test(methodLabel)) return easypaisaTransferMessage();
  return jazzcashTransferMessage();
}

export function paypalCheckoutUrl(
  amount?: number | null,
  currency?: string | null,
  receiveEmail = PAYPAL_RECEIVE_EMAIL
): string {
  const params = new URLSearchParams({
    cmd: "_xclick",
    business: receiveEmail,
    currency_code: (currency || "USD").toUpperCase(),
    item_name: "WAAMTO ERP Cloud subscription",
  });
  if (amount != null && Number.isFinite(Number(amount))) {
    params.set("amount", String(Number(amount).toFixed(2)));
  }
  return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
}
