import type { Decimal } from "@prisma/client/runtime/library";

export function formatCurrency(value: number | string | Decimal): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(value)
  );
}

/**
 * These are date-only fields stored as UTC midnight (from <input type="date">
 * and period boundaries). Formatting must pin timeZone: "UTC" or a local zone
 * behind UTC (e.g. US timezones) rolls the displayed date back by one day.
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}
