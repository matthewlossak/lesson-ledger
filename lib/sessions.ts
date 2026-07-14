// A session counts as "upcoming" until it has finished (start time + duration).
// All comparisons are pinned to Australia/Melbourne so they behave the same
// whether the server runs locally or on Vercel (which runs in UTC). Kept in one
// place so the dashboard, session list, and calendar all agree.

export const APP_TZ = "Australia/Melbourne"

// The wall-clock date/time a Melbourne clock shows for a given instant,
// packed into a single comparable number via Date.UTC. We only ever compare
// these packed numbers against each other, never treat them as real instants.
function melbourneComparable(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant)
  const get = (type: string) => Number(parts.find(p => p.type === type)!.value)
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"))
}

// Format a stored session date (UTC midnight) for display, in Melbourne time
// so it reads the same wherever the server runs.
export function formatSessionDate(
  date: Date | string,
  opts: Intl.DateTimeFormatOptions,
): string {
  return new Date(date).toLocaleDateString("en-AU", { timeZone: APP_TZ, ...opts })
}

// Format an "HH:MM" wall-clock start time as e.g. "4:00 pm". Parsed and
// formatted in the same fixed zone (UTC) so the result never shifts with the
// server's timezone.
export function formatSessionTime(startTime: string): string {
  const [h, m] = startTime.split(":").map(Number)
  return new Date(Date.UTC(1970, 0, 1, h, m)).toLocaleTimeString("en-AU", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

// A same-day session stays upcoming until start + duration has passed. Legacy
// sessions with no startTime have no scheduled time, so they count as upcoming
// only while their whole calendar day is still in the future.
export function isUpcoming(
  date: Date | string,
  startTime: string | null,
  duration: number | string,
  now: Date = new Date(),
): boolean {
  const nowC = melbourneComparable(now)

  // date is stored as UTC midnight; read its calendar day from the UTC parts.
  const d = new Date(date)
  const y = d.getUTCFullYear()
  const mo = d.getUTCMonth()
  const day = d.getUTCDate()

  if (!startTime) {
    return Date.UTC(y, mo, day, 0, 0) > nowC
  }

  const [h, m] = startTime.split(":").map(Number)
  const endMinutes = h * 60 + m + Math.round(Number(duration) * 60)
  // Passing the total minutes as the minute field lets Date.UTC roll over into
  // the next hour/day if a session runs past midnight.
  return Date.UTC(y, mo, day, 0, endMinutes) > nowC
}
