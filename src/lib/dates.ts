/** Format an ISO yyyy-mm-dd date as "29 October 2026". Returns the raw string if unparsable. */
export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** Current instant as ISO 8601 (UTC) - used for record metadata. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Today's LOCAL calendar date as ISO yyyy-mm-dd - used for date inputs. */
export function todayLocalIso(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}
