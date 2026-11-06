// Earnings aggregation for the dashboard and earnings pages. Nothing here is
// stored: every figure is derived from duration x rateCharged on demand.
// All dates are UTC midnights, the form session dates are stored in, so
// calendar arithmetic can use UTC parts without any timezone shifting.

import { isUpcoming } from './sessions'

export type EarningsSession = {
  date: Date
  startTime: string | null
  duration: number
  rateCharged: number
}

// end is exclusive
export type DateRange = { start: Date; end: Date }

export type EarningsTotals = {
  earned: number // finished sessions
  scheduled: number // sessions still to come
  hours: number // finished sessions only
  sessions: number // finished sessions only
}

const DAY_MS = 24 * 60 * 60 * 1000

export function totalsFor(
  sessions: EarningsSession[],
  range: DateRange,
  now: Date,
): EarningsTotals {
  const totals: EarningsTotals = { earned: 0, scheduled: 0, hours: 0, sessions: 0 }
  for (const s of sessions) {
    if (s.date < range.start || s.date >= range.end) continue
    const amount = s.duration * s.rateCharged
    if (isUpcoming(s.date, s.startTime, s.duration, now)) {
      totals.scheduled += amount
    } else {
      totals.earned += amount
      totals.hours += s.duration
      totals.sessions += 1
    }
  }
  return totals
}

export function startOfMonth(day: Date): Date {
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1))
}

export function addMonths(month: Date, count: number): Date {
  return new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + count, 1))
}

export function monthRange(day: Date): DateRange {
  const start = startOfMonth(day)
  return { start, end: addMonths(start, 1) }
}

// Weeks run Monday to Sunday.
export function weekRange(day: Date): DateRange {
  const daysSinceMonday = (day.getUTCDay() + 6) % 7
  const start = new Date(day.getTime() - daysSinceMonday * DAY_MS)
  return { start, end: new Date(start.getTime() + 7 * DAY_MS) }
}

// The weeks of a month, clipped at the month's edges so a month's weeks always
// add up to that month's total.
export function weeksOfMonth(month: Date): DateRange[] {
  const { start, end } = monthRange(month)
  const weeks: DateRange[] = []
  let cursor = start
  while (cursor < end) {
    const weekEnd = weekRange(cursor).end
    const clippedEnd = weekEnd < end ? weekEnd : end
    weeks.push({ start: cursor, end: clippedEnd })
    cursor = clippedEnd
  }
  return weeks
}

// The 12 months shown on the chart, ending at the current month unless the
// selected month falls outside that span.
export function chartMonths(selected: Date, currentMonth: Date): Date[] {
  const inDefaultWindow = selected <= currentMonth && selected >= addMonths(currentMonth, -11)
  const last = inDefaultWindow ? currentMonth : selected
  return Array.from({ length: 12 }, (_, i) => addMonths(last, i - 11))
}

export function monthKey(month: Date): string {
  return `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, '0')}`
}

export function parseMonthKey(key: string | undefined): Date | null {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(key ?? '')
  return match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)) : null
}

export function formatMonth(month: Date, style: 'short' | 'long' = 'long'): string {
  return month.toLocaleDateString('en-AU', {
    timeZone: 'UTC',
    month: style,
    ...(style === 'long' && { year: 'numeric' }),
  })
}

// e.g. "June"
export function monthName(month: Date): string {
  return month.toLocaleDateString('en-AU', { timeZone: 'UTC', month: 'long' })
}

// e.g. "2-8 Nov", "30 Oct-1 Nov", or "1 Nov" for a single day.
export function formatRange({ start, end }: DateRange): string {
  const last = new Date(end.getTime() - DAY_MS)
  const month = (d: Date) => formatMonth(d, 'short')
  if (start.getTime() === last.getTime()) return `${start.getUTCDate()} ${month(start)}`
  if (start.getUTCMonth() === last.getUTCMonth()) {
    return `${start.getUTCDate()}-${last.getUTCDate()} ${month(last)}`
  }
  return `${start.getUTCDate()} ${month(start)}-${last.getUTCDate()} ${month(last)}`
}

// Whole dollars where possible, cents only when a figure actually has them.
export function formatDollars(amount: number): string {
  const cents = Math.round(amount * 100)
  return `$${(cents / 100).toLocaleString('en-AU', {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}
