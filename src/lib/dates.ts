/** Format an ISO yyyy-mm-dd date as "29 October 2026". Returns the raw string if unparsable. */
export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Format charges for display: numeric values get the rupee symbol and Indian grouping. */
export function formatCharges(charges: string): string {
  const raw = (charges ?? "").trim();
  if (!raw) return "";
  if (/^[0-9]+(\.[0-9]+)?$/.test(raw)) {
    return "\u20B9" + Number(raw).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }
  return raw;
}
