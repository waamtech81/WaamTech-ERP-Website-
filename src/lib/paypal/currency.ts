/** PayPal Checkout currency helpers (safe for client + server). */

export const PAYPAL_ORDER_CURRENCIES = new Set([
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
  "JPY",
  "NZD",
  "CHF",
  "HKD",
  "SGD",
  "SEK",
  "DKK",
  "NOK",
  "PLN",
  "CZK",
  "HUF",
  "ILS",
  "MXN",
  "BRL",
  "PHP",
  "THB",
  "TWD",
  "MYR",
]);

export function paypalSdkCurrency(currency?: string | null): string {
  const code = String(currency || "USD")
    .trim()
    .toUpperCase();
  return PAYPAL_ORDER_CURRENCIES.has(code) ? code : "USD";
}
