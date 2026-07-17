// Utils barrel — add utility functions here
// e.g.: export { formatDate, formatKp, formatDst } from './format';
// e.g.: export { cn } from './cn';

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely (shadcn/ui pattern) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format ISO timestamp to human-readable */
export function formatDateTime(iso: string, options?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    ...options,
  });
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Format a number with fixed decimal places, returning a dash for nullish */
export function formatMetric(value: number | undefined | null, decimals = 1, unit = ""): string {
  if (value == null) return "—";
  return `${value.toFixed(decimals)}${unit}`;
}
