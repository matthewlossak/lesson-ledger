'use client'

import { useState } from 'react'
import { addMonths, monthName, monthRange, parseMonthKey } from '@/lib/earnings'
import { formatSessionDate, isUpcoming } from '@/lib/sessions'

type ExportSession = {
  id: number
  date: string
  startTime: string | null
  duration: number
  students: { student: { name: string } }[]
}

function sessionsIn(sessions: ExportSession[], month: Date) {
  const { start, end } = monthRange(month)
  return sessions.filter(s => {
    const date = new Date(s.date)
    return date >= start && date < end
  })
}

export default function ExportInvoiceForm({
  sessions,
  defaultPeriod,
}: {
  sessions: ExportSession[]
  defaultPeriod: string // "YYYY-MM"
}) {
  const [period, setPeriod] = useState(defaultPeriod)
  const [ticked, setTicked] = useState<number[]>([])

  const isFinished = (s: ExportSession) => !isUpcoming(s.date, s.startTime, s.duration)

  const month = parseMonthKey(period)
  const previousMonth = month && addMonths(month, -1)
  const lastMonthSessions = previousMonth
    ? sessionsIn(sessions, previousMonth)
        .filter(isFinished)
        .sort((a, b) => b.date.localeCompare(a.date))
    : []
  const notYetHeld = month ? sessionsIn(sessions, month).filter(s => !isFinished(s)).length : 0

  function changePeriod(value: string) {
    setPeriod(value)
    setTicked([])
  }

  function toggle(id: number) {
    setTicked(t => (t.includes(id) ? t.filter(x => x !== id) : [...t, id]))
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
          onChange={e => changePeriod(e.target.value)}
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

      {month && previousMonth && notYetHeld > 0 && (
        <p className="text-xs text-muted mt-2 mb-1">
          {notYetHeld} {notYetHeld === 1 ? 'session' : 'sessions'} later in {monthName(month)} {notYetHeld === 1 ? "hasn't" : "haven't"} happened
          yet, so {notYetHeld === 1 ? 'it stays' : 'they stay'} off this invoice. You can add {notYetHeld === 1 ? 'it' : 'them'} to {monthName(addMonths(month, 1))}&apos;s.
        </p>
      )}

      {previousMonth && lastMonthSessions.length > 0 && (
        <details className="mt-2 mb-1">
          <summary className="text-sm text-foreground cursor-pointer">
            Add sessions from {monthName(previousMonth)}
            {ticked.length > 0 && <span className="text-muted"> ({ticked.length} added)</span>}
          </summary>
          <ul className="mt-2 max-h-56 overflow-y-auto border border-border rounded-lg bg-white divide-y divide-border">
            {lastMonthSessions.map(s => (
              <li key={s.id}>
                <label className="flex items-start gap-2 px-3 py-2 text-sm text-foreground cursor-pointer hover:bg-badge">
                  <input
                    type="checkbox"
                    name="extra"
                    value={s.id}
                    checked={ticked.includes(s.id)}
                    onChange={() => toggle(s.id)}
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
