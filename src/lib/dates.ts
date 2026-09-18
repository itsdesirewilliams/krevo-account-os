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
  return toIsoDate(new Date());
}

/* ---------------- ISO calendar helpers (Monday-Sunday weeks) ---------------- */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local calendar date of a Date as ISO yyyy-mm-dd. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Parse an ISO yyyy-mm-dd date as a local Date, or null when invalid. */
export function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return isNaN(date.getTime()) ? null : date;
}

/** Add whole days to an ISO date (returns the input unchanged if unparsable). */
export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/** Monday of the ISO week containing `iso`. */
export function startOfIsoWeek(iso: string): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  const mondayOffset = (date.getDay() + 6) % 7; // Sunday=0 -> 6, Monday=0
  date.setDate(date.getDate() - mondayOffset);
  return toIsoDate(date);
}

export function addWeeks(iso: string, weeks: number): string {
  return addDays(iso, weeks * 7);
}

/** Monday-Sunday bounds of the ISO week containing `iso`. */
export function weekRange(iso: string): { start: string; end: string } {
  const start = startOfIsoWeek(iso);
  return { start, end: addDays(start, 6) };
}

/** ISO week identifier, e.g. "2026-W43". */
export function weekKey(iso: string): string {
  const date = parseIsoDate(iso);
  if (!date) return "";
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNr = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3); // nearest Thursday
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDayNr = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3);
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * DAY_MS));
  return `${target.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
