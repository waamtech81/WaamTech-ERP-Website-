/**
 * Portal payment method catalog — geo-aware UI instructions.
 * Engine checkout gateways stay stripe|paypal|bank|manual|simulated;
 * Pakistan wallets / Wise map to bank|manual with a structured reference.
 *
 * Payment account details come from License Engine (checkout session or
 * /v1/public/billing/payment-methods). Bank transfer fields fall back to
 * Askari Bank SSOT when Engine sends placeholders or incomplete values.
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

/** Askari Bank — direct transfer details for portal checkout (end-user SSOT). */
export const ASKARI_BANK_TRANSFER_DETAILS = {
  bank_name: "Askari Bank",
  account_title: "WAAMTECH",
  account_number: "1150420000732",
  iban: "PK81ASCM0001150420000732",
  swift: "ASCMPKKA",
  branch: "Kamran Center Branch, ISB-PK",
  currency: "PKR",
  instructions:
    "Transfer the exact bill amount in PKR. Include your checkout reference in the transfer description, then enter the transaction ID below.",
} as const;

function nonEmpty(value: unknown): string | null {
  const s = String(value ?? "").trim();
  return s ? s : null;
}

/** True when Engine supplied enough detail to render a method safely. */
export function isPortalPaymentMethodConfigReady(
  config: Partial<PortalPaymentMethodConfig> | null | undefined
): config is PortalPaymentMethodConfig {
  if (!config) return false;
  const bank = config.bank;
  if (
    !bank ||
    !nonEmpty(bank.bank_name) ||
    !nonEmpty(bank.account_title) ||
    !nonEmpty(bank.account_number)
  ) {
    return false;
  }
  if (!nonEmpty(config.jazzcash?.account_number)) return false;
  if (!nonEmpty(config.easypaisa?.iban)) return false;
  if (!nonEmpty(config.wise?.payment_id)) return false;
  if (!nonEmpty(config.paypal?.receive_email)) return false;
  return true;
}

function isInvalidBankTransferValue(value: unknown): boolean {
  const s = String(value ?? "").trim();
  if (!s) return true;
  if (/add_if_missing/i.test(s)) return true;
  if (/\bBANK_[A-Z0-9_]+\b/i.test(s)) return true;
  if (/^standard$/i.test(s)) return true;
  return false;
}

function resolveBankTransferField(value: unknown, fallback: string): string {
  if (isInvalidBankTransferValue(value)) return fallback;
  const s = String(value).trim();
  if (/add_if_missing|\bBANK_[A-Z0-9_]+\b/i.test(s)) return fallback;
  return s;
}

/** Normalize bank block — force Askari details when Engine/env placeholders leak through. */
export function sanitizeBankTransferDetails(
  bank: Partial<PortalPaymentMethodConfig["bank"]> | null | undefined
): PortalPaymentMethodConfig["bank"] {
  const defaults = ASKARI_BANK_TRANSFER_DETAILS;
  return {
    bank_name: resolveBankTransferField(bank?.bank_name, defaults.bank_name),
    account_title: resolveBankTransferField(bank?.account_title, defaults.account_title),
    account_number: resolveBankTransferField(bank?.account_number, defaults.account_number),
    iban: resolveBankTransferField(bank?.iban, defaults.iban),
    swift: resolveBankTransferField(bank?.swift, defaults.swift),
    branch: resolveBankTransferField(bank?.branch, defaults.branch),
    currency: resolveBankTransferField(bank?.currency, defaults.currency),
    instructions: (() => {
      const raw = bank?.instructions;
      if (raw == null) return defaults.instructions;
      const s = String(raw).trim();
      if (!s || isInvalidBankTransferValue(s)) return defaults.instructions;
      return s;
    })(),
  };
}

/** Normalize Engine payment-method config — bank block sanitized to Askari SSOT when needed. */
export function normalizePortalPaymentMethodConfig(
  fromEngine: Partial<PortalPaymentMethodConfig> | null | undefined
): PortalPaymentMethodConfig | null {
  if (!isPortalPaymentMethodConfigReady(fromEngine)) return null;
  const bank = fromEngine.bank!;
  return {
    bank: sanitizeBankTransferDetails(bank),
    jazzcash: {
      account_number: nonEmpty(fromEngine.jazzcash!.account_number)!,
    },
    easypaisa: {
      iban: nonEmpty(fromEngine.easypaisa!.iban)!,
    },
    wise: {
      payment_id: nonEmpty(fromEngine.wise!.payment_id)!,
    },
    paypal: {
      receive_email: nonEmpty(fromEngine.paypal!.receive_email)!,
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

export function jazzcashTransferMessage(accountNumber: string): string {
  return `Send the exact bill amount to JazzCash using account number ${accountNumber}. After the transfer succeeds, enter the transaction ID below and submit — License Engine will record the payment and notify your account.`;
}

export function easypaisaTransferMessage(iban: string): string {
  return `Send the exact bill amount via EasyPaisa bank transfer using IBAN ${iban}. After the transfer succeeds, enter the transaction ID below and submit — License Engine will record the payment and notify your account.`;
}

/** @deprecated Use jazzcashTransferMessage or easypaisaTransferMessage */
export function walletTransferMessage(methodLabel: string, config: PortalPaymentMethodConfig): string {
  if (/easypaisa/i.test(methodLabel)) return easypaisaTransferMessage(config.easypaisa.iban);
  return jazzcashTransferMessage(config.jazzcash.account_number);
}

export function paypalCheckoutUrl(
  amount?: number | null,
  currency?: string | null,
  receiveEmail?: string
): string {
  const params = new URLSearchParams({
    cmd: "_xclick",
    business: receiveEmail || "",
    currency_code: (currency || "USD").toUpperCase(),
    item_name: "WAAMTO ERP Cloud subscription",
  });
  if (amount != null && Number.isFinite(Number(amount))) {
    params.set("amount", String(Number(amount).toFixed(2)));
  }
  return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
}
