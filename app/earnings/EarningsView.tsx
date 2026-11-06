import Link from 'next/link'
import {
  addMonths,
  chartMonths,
  formatDollars,
  formatMonth,
  formatRange,
  monthKey,
  monthRange,
  totalsFor,
  weeksOfMonth,
  type EarningsSession,
} from '@/lib/earnings'
import BarChart, { type ChartBar } from './BarChart'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border rounded-xl p-4">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-xl sm:text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

export default function EarningsView({
  sessions,
  selected,
  currentMonth,
  now,
}: {
  sessions: EarningsSession[]
  selected: Date
  currentMonth: Date
  now: Date
}) {
  const monthBars: ChartBar[] = chartMonths(selected, currentMonth).map(month => ({
    key: monthKey(month),
    // en-AU's short months include "June" and "Sept", too wide for 12 bars on a phone.
    label: formatMonth(month, 'short').slice(0, 3),
    title: formatMonth(month),
    totals: totalsFor(sessions, monthRange(month), now),
    href: `/earnings?month=${monthKey(month)}`,
    selected: month.getTime() === selected.getTime(),
  }))

  const weeks = weeksOfMonth(selected).map(range => ({
    range,
    totals: totalsFor(sessions, range, now),
  }))
  const weekBars: ChartBar[] = weeks.map(({ range, totals }) => ({
    key: range.start.toISOString(),
    // The month is in the section heading, so the axis only needs the days.
    label: formatRange(range).split(' ')[0],
    title: formatRange(range),
    totals,
  }))

  const monthTotals = totalsFor(sessions, monthRange(selected), now)
  const showScheduled = monthTotals.scheduled > 0
  const navLinkClass = 'border border-border bg-white rounded-lg w-8 h-8 flex items-center justify-center text-foreground hover:bg-badge transition-colors'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-foreground mb-6">Earnings</h1>

      <section className="border border-border rounded-xl bg-white p-4 sm:p-5 mb-8">
        <h2 className="text-sm font-semibold text-foreground">Month by month</h2>
        <p className="text-xs text-muted mb-4">Select a month to see its weeks.</p>
        <BarChart bars={monthBars} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">{formatMonth(selected)}</h2>
          <div className="flex gap-2">
            <Link
              href={`/earnings?month=${monthKey(addMonths(selected, -1))}`}
              scroll={false}
              aria-label="Previous month"
              className={navLinkClass}
            >
              ←
            </Link>
            <Link
              href={`/earnings?month=${monthKey(addMonths(selected, 1))}`}
              scroll={false}
              aria-label="Next month"
              className={navLinkClass}
            >
              →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Stat label="Earned" value={formatDollars(monthTotals.earned)} />
          <Stat label="Sessions" value={monthTotals.sessions} />
          <Stat label="Hours" value={monthTotals.hours} />
        </div>

        <div className="border border-border rounded-xl bg-white p-4 sm:p-5 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Week by week</h3>
          <BarChart bars={weekBars} />
        </div>

        <div className="border border-border rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted border-b border-border">
                <th scope="col" className="text-left font-medium px-4 py-2">Week</th>
                <th scope="col" className="text-right font-medium px-2 sm:px-4 py-2">Sessions</th>
                <th scope="col" className="text-right font-medium px-2 sm:px-4 py-2">Hours</th>
                {showScheduled && (
                  <th scope="col" className="text-right font-medium px-2 sm:px-4 py-2">Scheduled</th>
                )}
                <th scope="col" className="text-right font-medium px-4 py-2">Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {weeks.map(({ range, totals }) => (
                <tr key={range.start.toISOString()}>
                  <th scope="row" className="text-left font-normal text-foreground px-4 py-2 whitespace-nowrap">
                    {formatRange(range)}
                  </th>
                  <td className="text-right text-muted px-2 sm:px-4 py-2">{totals.sessions}</td>
                  <td className="text-right text-muted px-2 sm:px-4 py-2">{totals.hours}</td>
                  {showScheduled && (
                    <td className="text-right text-muted px-2 sm:px-4 py-2">
                      {totals.scheduled > 0 ? formatDollars(totals.scheduled) : '-'}
                    </td>
                  )}
                  <td className="text-right font-medium text-foreground px-4 py-2">
                    {formatDollars(totals.earned)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-semibold text-foreground">
                <th scope="row" className="text-left font-semibold px-4 py-2">Total</th>
                <td className="text-right px-2 sm:px-4 py-2">{monthTotals.sessions}</td>
                <td className="text-right px-2 sm:px-4 py-2">{monthTotals.hours}</td>
                {showScheduled && (
                  <td className="text-right px-2 sm:px-4 py-2">{formatDollars(monthTotals.scheduled)}</td>
                )}
                <td className="text-right px-4 py-2">{formatDollars(monthTotals.earned)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  )
}
