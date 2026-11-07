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
  countsInMonth: string | null
}

// end is exclusive
export type DateRange = { start: Date; end: Date }

export type EarningsTotals = {
  earned: number // finished sessions
  scheduled: number // sessions still to come
  hours: number // finished sessions only
  sessions: number // finished sessions only
  scheduledSessions: number
}

const DAY_MS = 24 * 60 * 60 * 1000

function totalsOf(sessions: EarningsSession[], now: Date): EarningsTotals {
  const totals: EarningsTotals = { earned: 0, scheduled: 0, hours: 0, sessions: 0, scheduledSessions: 0 }
  for (const s of sessions) {
    const amount = s.duration * s.rateCharged
    if (isUpcoming(s.date, s.startTime, s.duration, now)) {
      totals.scheduled += amount
      totals.scheduledSessions += 1
    } else {
      totals.earned += amount
      totals.hours += s.duration
      totals.sessions += 1
    }
  }
  return totals
}

function isWithin(date: Date, { start, end }: DateRange): boolean {
  return date >= start && date < end
}

// By the date sessions actually happened, ignoring any move to another month.
export function totalsForRange(
  sessions: EarningsSession[],
  range: DateRange,
  now: Date,
): EarningsTotals {
  return totalsOf(sessions.filter(s => isWithin(s.date, range)), now)
}

// The month a session belongs to: where it was moved, else when it happened.
export function countedMonth(s: { date: Date | string; countsInMonth: string | null }): string {
  return s.countsInMonth ?? monthKey(new Date(s.date))
}

export function totalsForMonth(sessions: EarningsSession[], month: Date, now: Date): EarningsTotals {
  return totalsOf(sessions.filter(s => countedMonth(s) === monthKey(month)), now)
}

export type MonthBreakdownRow = {
  start: Date
  axisLabel: string
  title: string
  totals: EarningsTotals
}

// A month's total split into its weeks, plus one row per month that sessions
// were moved in from, so the rows always add up to the month's total.
export function monthBreakdown(sessions: EarningsSession[], month: Date, now: Date): MonthBreakdownRow[] {
  const counted = sessions.filter(s => countedMonth(s) === monthKey(month))
  const ownMonth = monthRange(month)

  const weeks = weeksOfMonth(month).map(range => ({
    start: range.start,
    // The month is in the section heading, so the axis only needs the days.
    axisLabel: formatRange(range).split(' ')[0],
    title: formatRange(range),
    totals: totalsForRange(counted, range, now),
  }))

  const movedIn = new Map<string, EarningsSession[]>()
  for (const s of counted) {
    if (isWithin(s.date, ownMonth)) continue
    const key = monthKey(s.date)
    movedIn.set(key, [...(movedIn.get(key) ?? []), s])
  }
  const movedRows = [...movedIn].map(([key, moved]) => {
    const origin = parseMonthKey(key)!
    return {
      start: origin,
      axisLabel: formatMonth(origin, 'short'),
      title: `From ${monthName(origin)}`,
      totals: totalsOf(moved, now),
    }
  })

  return [...movedRows, ...weeks].sort((a, b) => a.start.getTime() - b.start.getTime())
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

// Short months are cut to three letters because en-AU gives "June" and "Sept".
export function formatMonth(month: Date, style: 'short' | 'long' = 'long'): string {
  if (style === 'short') {
    return month.toLocaleDateString('en-AU', { timeZone: 'UTC', month: 'short' }).slice(0, 3)
  }
  return month.toLocaleDateString('en-AU', { timeZone: 'UTC', month: 'long', year: 'numeric' })
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
