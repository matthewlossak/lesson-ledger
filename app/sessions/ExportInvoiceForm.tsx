'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { addMonths, countedMonth, monthKey, monthName, parseMonthKey } from '@/lib/earnings'
import { formatSessionDate, isUpcoming } from '@/lib/sessions'
import { moveSessionToMonth } from './actions'

type ExportSession = {
  id: number
  date: string
  startTime: string | null
  duration: number
  countsInMonth: string | null
  students: { student: { name: string } }[]
}

export default function ExportInvoiceForm({
  sessions,
  defaultPeriod,
}: {
  sessions: ExportSession[]
  defaultPeriod: string // "YYYY-MM"
}) {
  const [period, setPeriod] = useState(defaultPeriod)
  const [, startTransition] = useTransition()

  const month = parseMonthKey(period)
  const previousMonth = month && addMonths(month, -1)
  const previousKey = previousMonth && monthKey(previousMonth)

  // Last month's finished sessions, including any already moved into this month.
  const movable = sessions
    .filter(s => monthKey(new Date(s.date)) === previousKey)
    .filter(s => s.countsInMonth === null || s.countsInMonth === period)
    .filter(s => !isUpcoming(s.date, s.startTime, s.duration))
    .sort((a, b) => b.date.localeCompare(a.date))

  const [movedIds, setMovedIds] = useOptimistic(
    movable.filter(s => s.countsInMonth === period).map(s => s.id),
    (ids: number[], change: { id: number; moved: boolean }) =>
      change.moved ? [...ids, change.id] : ids.filter(id => id !== change.id),
  )

  const notYetHeld = sessions.filter(
    s => countedMonth(s) === period && isUpcoming(s.date, s.startTime, s.duration),
  ).length

  function toggle(id: number, moved: boolean) {
    startTransition(async () => {
      setMovedIds({ id, moved })
      await moveSessionToMonth(id, moved ? period : null)
    })
  }

  return (
    <form
      action="/api/invoice"
      method="GET"
      className="w-full sm:w-auto sm:max-w-md border border-border bg-badge rounded-lg pl-3 pr-2 py-1.5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="export-period" className="text-sm text-muted whitespace-nowrap">
          Export invoice for
        </label>
        <input
          id="export-period"
          type="month"
          name="period"
          value={period}
          onChange={e => setPeriod(e.target.value)}
          required
          className="border border-border rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        />
        <button
          type="submit"
          className="border border-border bg-white text-sm font-medium text-foreground px-3 py-1.5 rounded-lg hover:bg-badge transition-colors whitespace-nowrap"
        >
          Export
        </button>
      </div>

      {month && notYetHeld > 0 && (
        <p className="text-xs text-muted mt-2 mb-1">
          {notYetHeld} {notYetHeld === 1 ? 'session' : 'sessions'} later in {monthName(month)} {notYetHeld === 1 ? "hasn't" : "haven't"} happened
          yet, so {notYetHeld === 1 ? 'it stays' : 'they stay'} off this invoice. Move {notYetHeld === 1 ? 'it' : 'them'} into {monthName(addMonths(month, 1))} once held.
        </p>
      )}

      {month && previousMonth && movable.length > 0 && (
        <details className="mt-2 mb-1">
          <summary className="text-sm text-foreground cursor-pointer">
            Move sessions from {monthName(previousMonth)}
            {movedIds.length > 0 && <span className="text-muted"> ({movedIds.length} moved)</span>}
          </summary>
          <p className="text-xs text-muted mt-2">
            Ticked sessions become {monthName(month)} sessions for earnings and invoices. This saves as you tick.
          </p>
          <ul className="mt-2 max-h-56 overflow-y-auto border border-border rounded-lg bg-white divide-y divide-border">
            {movable.map(s => (
              <li key={s.id}>
                <label className="flex items-start gap-2 px-3 py-2 text-sm text-foreground cursor-pointer hover:bg-badge">
                  <input
                    type="checkbox"
                    checked={movedIds.includes(s.id)}
                    onChange={e => toggle(s.id, e.target.checked)}
                    className="mt-1 accent-primary"
                  />
                  <span>
                    {formatSessionDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                    <span className="text-muted">
                      {' · '}{s.students.map(ss => ss.student.name).join(', ')} · {s.duration}h
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </details>
      )}
    </form>
  )
}
