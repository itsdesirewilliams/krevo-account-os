/** INR currency formatting + strict parsing of loosely typed amounts. */

export const formatINR = (n: number): string => "\u20B9" + Math.round(n).toLocaleString("en-IN");

const FIRST_NUMBER = /\d+(?:\.\d+)?/;

/**
 * Parse a single non-negative amount from loosely typed user input.
 * Thousands separators are ignored and only the FIRST number is used, so
 * ranges like "25,000-30,000" resolve to 25000 rather than a concatenation.
 * Unparsable input yields 0.
 */
export function parseAmount(raw: string | number | null | undefined): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (raw == null) return 0;
  const match = FIRST_NUMBER.exec(String(raw).replace(/,/g, ""));
  if (!match) return 0;
  const n = Number.parseFloat(match[0]);
  return Number.isFinite(n) ? n : 0;
}

/** Format a loosely typed charges string for display. */
export function formatCharges(charges: string): string {
  const raw = (charges ?? "").trim();
  if (!raw) return "";
  if (/^[0-9]+(\.[0-9]+)?$/.test(raw)) {
    return "\u20B9" + Number(raw).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }
  return raw;
}
