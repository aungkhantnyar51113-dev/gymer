/**
 * Local-calendar date helpers.
 *
 * Food logs are stored with a `date` of `YYYY-MM-DD` derived from the user's
 * local calendar day. Everything here therefore works in local time and never
 * goes through `Date#toISOString()`, which would convert to UTC and shift the
 * day for anyone behind or ahead of UTC.
 */

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today's date key in the user's local timezone. */
export function getTodayKey() {
  return toDateKey(new Date());
}

/** Parses a `YYYY-MM-DD` key into a local Date anchored at noon. */
export function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  // Noon avoids DST boundaries where midnight may not exist or repeats.
  return new Date(year, (month || 1) - 1, day || 1, 12);
}

/**
 * Returns `count` date keys starting from today and going back in time,
 * newest first: ["2026-11-01", "2026-10-31", ...].
 */
export function getRecentDateKeys(count: number) {
  const today = new Date();
  const anchor = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    12
  );

  const keys: string[] = [];
  for (let offset = 0; offset < count; offset += 1) {
    const day = new Date(anchor);
    day.setDate(anchor.getDate() - offset);
    keys.push(toDateKey(day));
  }
  return keys;
}

/** "2026-11-01" -> "Nov 1, 2026" */
export function formatDateLabel(key: string) {
  return parseDateKey(key).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Today" / "Yesterday" for recent keys, otherwise null. */
export function getRelativeDayLabel(key: string): string | null {
  const [today, yesterday] = getRecentDateKeys(2);
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return null;
}
