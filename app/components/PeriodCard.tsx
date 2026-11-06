import { formatDollars, type EarningsTotals } from '@/lib/earnings'

export default function PeriodCard({
  title,
  range,
  totals,
}: {
  title: string
  range: string
  totals: EarningsTotals
}) {
  return (
    <div className="border border-border rounded-xl p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 mb-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted">{range}</span>
      </div>
      <p className="text-2xl sm:text-3xl font-semibold text-foreground">
        {formatDollars(totals.earned)} <span className="text-xs font-normal text-muted">earned</span>
      </p>
      <p className="text-xs text-muted mt-1">
        {totals.sessions} {totals.sessions === 1 ? 'session' : 'sessions'} · {totals.hours}h
      </p>
      {totals.scheduled > 0 && (
        <p className="text-xs text-muted mt-1">
          <span className="font-medium text-foreground">{formatDollars(totals.scheduled)}</span> still scheduled
        </p>
      )}
    </div>
  )
}
