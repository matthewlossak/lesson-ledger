import Link from 'next/link'
import { formatDollars, type EarningsTotals } from '@/lib/earnings'

export type ChartBar = {
  key: string
  label: string // shown under the bar
  title: string // shown at the top of the tooltip
  totals: EarningsTotals
  href?: string
  selected?: boolean
}

// Rounds up to a clean axis step, aiming for about four gridlines.
function axisStep(max: number): number {
  if (max <= 0) return 100
  const magnitude = 10 ** Math.floor(Math.log10(max / 4))
  const step = [1, 2, 2.5, 5, 10].find(m => (m * magnitude * 4) >= max)!
  return step * magnitude
}

function Bar({ bar, axisMax, index, count }: { bar: ChartBar; axisMax: number; index: number; count: number }) {
  const { earned, scheduled, sessions, hours } = bar.totals
  const total = earned + scheduled
  const tipBottom = (total / axisMax) * 100
  // Keep the tooltip inside the chart at both edges.
  const tooltipAlign =
    index < count / 3 ? 'left-0' : index >= (count * 2) / 3 ? 'right-0' : 'left-1/2 -translate-x-1/2'

  const contents = (
    <>
      <div className={`relative h-48 flex flex-col justify-end items-center gap-0.5 rounded-t-md ${bar.selected ? 'bg-badge' : ''}`}>
        {scheduled > 0 && (
          <div
            className="w-full max-w-6 bg-chart-scheduled rounded-t"
            style={{ height: `${(scheduled / axisMax) * 100}%` }}
          />
        )}
        {earned > 0 && (
          <div
            className={`w-full max-w-6 bg-chart-earned ${scheduled > 0 ? '' : 'rounded-t'}`}
            style={{ height: `${(earned / axisMax) * 100}%` }}
          />
        )}
      </div>
      <div className={`h-7 pt-1.5 text-center text-[11px] sm:text-xs whitespace-nowrap ${bar.selected ? 'font-semibold text-foreground' : 'text-muted'}`}>
        {bar.label}
      </div>
      <div
        className={`hidden group-hover:block group-focus-visible:block absolute z-10 w-40 mb-1 ${tooltipAlign} pointer-events-none bg-white border border-border rounded-lg shadow-sm px-3 py-2 text-xs text-muted`}
        style={{ bottom: `calc(1.75rem + ${(tipBottom / 100) * 12}rem)` }}
      >
        <p className="font-semibold text-foreground mb-1">{bar.title}</p>
        <p className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-chart-earned" /> Earned
          </span>
          <span className="font-medium text-foreground">{formatDollars(earned)}</span>
        </p>
        {scheduled > 0 && (
          <p className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-chart-scheduled" /> Scheduled
            </span>
            <span className="font-medium text-foreground">{formatDollars(scheduled)}</span>
          </p>
        )}
        <p className="mt-1">
          {sessions} {sessions === 1 ? 'session' : 'sessions'} · {hours}h
        </p>
      </div>
    </>
  )

  const slotClass = 'group relative flex-1 min-w-0 px-px rounded-t-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
  return bar.href ? (
    <Link
      href={bar.href}
      scroll={false}
      aria-current={bar.selected ? 'true' : undefined}
      aria-label={`${bar.title}: ${formatDollars(earned)} earned`}
      className={`${slotClass} block`}
    >
      {contents}
    </Link>
  ) : (
    <div tabIndex={0} aria-label={`${bar.title}: ${formatDollars(earned)} earned`} className={slotClass}>
      {contents}
    </div>
  )
}

// Plain markup rather than a chart library, so the page ships no chart
// JavaScript and renders on the server. Hover and focus tooltips are CSS only.
export default function BarChart({ bars }: { bars: ChartBar[] }) {
  const max = Math.max(...bars.map(b => b.totals.earned + b.totals.scheduled))
  const step = axisStep(max)
  const axisMax = Math.max(Math.ceil(max / step), 1) * step
  const ticks = Array.from({ length: Math.round(axisMax / step) + 1 }, (_, i) => i * step)
  const hasScheduled = bars.some(b => b.totals.scheduled > 0)

  return (
    <figure>
      {hasScheduled && (
        <figcaption className="flex gap-4 mb-3 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-chart-earned" /> Earned
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-chart-scheduled" /> Scheduled
          </span>
        </figcaption>
      )}
      <div className="relative pl-11">
        <div className="absolute inset-x-0 top-0 h-48" aria-hidden="true">
          {ticks.map(tick => (
            <div
              key={tick}
              className="absolute inset-x-0 flex items-center"
              style={{ bottom: `${(tick / axisMax) * 100}%`, height: 0 }}
            >
              <span className="w-10 pr-2 text-right text-[11px] text-muted">
                {formatDollars(tick)}
              </span>
              <span className="flex-1 border-t border-border" />
            </div>
          ))}
        </div>
        <div className="relative flex">
          {bars.map((bar, i) => (
            <Bar key={bar.key} bar={bar} axisMax={axisMax} index={i} count={bars.length} />
          ))}
        </div>
      </div>
    </figure>
  )
}
