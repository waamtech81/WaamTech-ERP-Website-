import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat(currency === "PKR" ? "en-PK" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "PKR" ? 0 : amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/** Approximate PKR equivalent for display alongside USD pricing */
export function usdToPkr(usd: number, rate = 280) {
  return Math.round(usd * rate);
}

export function formatDualPrice(usd: number) {
  return {
    usd: formatCurrency(usd),
    pkr: formatCurrency(usdToPkr(usd), "PKR"),
  };
}
