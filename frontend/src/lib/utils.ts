import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<string | undefined | null | false>) {
  return twMerge(clsx(inputs));
}

// Currency settings cache (will be updated by CurrencyProvider)
let currencyCache: { currencyCode: string; currencySymbol: string; locale: string } = {
  currencyCode: 'INR',
  currencySymbol: '₹',
  locale: 'en-IN',
};

export function setCurrencySettings(settings: { currencyCode: string; currencySymbol: string; locale: string }) {
  currencyCache = settings;
}

export function formatCurrency(value: number, options: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat(currencyCache.locale, {
    style: "currency",
    currency: currencyCache.currencyCode,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function formatPercent(value: number, options: Intl.NumberFormatOptions = {}) {
  return `${value > 0 ? "+" : ""}${value.toFixed(options.maximumFractionDigits ?? 2)}%`;
}

/**
 * Formats a number with consistent formatting (SSR-safe).
 * Uses standard comma grouping (every 3 digits) to avoid hydration mismatches.
 */
export function formatNumber(value: number): string {
  // Use a deterministic approach that works the same on server and client
  const numStr = value.toString();
  const parts = numStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Add commas every 3 digits from right to left
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}


