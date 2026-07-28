import type { PaymentMethodId } from "@/lib/portal/payment-methods";

/** WebP checkout icons under public/payments/ */
export const PAYMENT_METHOD_ICONS: Record<PaymentMethodId, string> = {
  jazzcash: "/payments/jazzcash.webp",
  easypaisa: "/payments/easypaisa.webp",
  paypal: "/payments/paypal.webp",
  stripe: "/payments/stripe.webp",
  card: "/payments/card.webp",
  bank: "/payments/bank.webp",
  wise: "/payments/wise.webp",
};

export function paymentMethodIcon(id: string): string | null {
  return PAYMENT_METHOD_ICONS[id as PaymentMethodId] || null;
}
