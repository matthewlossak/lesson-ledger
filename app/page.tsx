export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { isUpcoming, formatSessionDate, formatSessionTime } from '@/lib/sessions'

function startOf(unit: 'month' | 'year') {
  const d = new Date()
  if (unit === 'month') return new Date(d.getFullYear(), d.getMonth(), 1)
  return new Date(d.getFullYear(), 0, 1)
}

export default async function Home() {
  const session = await auth()
  if (!session) return null
  const userId = parseInt(session.user.id)
  const firstName = session.user.name?.split(' ')[0] ?? 'there'
  const now = new Date()

  const [students, sessions] = await Promise.all([
    prisma.student.count({ where: { userId } }),
    prisma.session.findMany({
      where: { students: { some: { student: { userId } } } },
      include: { students: { include: { student: true } } },
      orderBy: { date: 'asc' },
    }),
  ])

  const past = sessions.filter(s => !isUpcoming(s.date, s.startTime, Number(s.duration), now))
  const upcoming = sessions.filter(s => isUpcoming(s.date, s.startTime, Number(s.duration), now))

  const earnings = (subset: typeof past, from?: Date) =>
    subset
      .filter(s => !from || s.date >= from)
      .reduce((sum, s) => sum + Number(s.duration) * Number(s.rateCharged), 0)

  const hours = (subset: typeof past, from?: Date) =>
    subset
      .filter(s => !from || s.date >= from)
      .reduce((sum, s) => sum + Number(s.duration), 0)

  const past30Days = new Date()
  past30Days.setDate(past30Days.getDate() - 30)
  past30Days.setHours(0, 0, 0, 0)

  const thisMonthEarnings = earnings(past, startOf('month'))
  const thisYearEarnings = earnings(past, startOf('year'))
  const allTimeEarnings = earnings(past)
  const recentHours = hours(past, past30Days)
  const recentSessionCount = past.filter(s => s.date >= past30Days).length
  const projectedEarnings = earnings(upcoming)
  const recentSessions = [...past].reverse().slice(0, 5)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Welcome back, {firstName}</h1>
        <Link
          href="/sessions/new"
          className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
        >
          + Add session
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Students</p>
          <p className="text-2xl font-semibold text-foreground">{students}</p>
        </div>
        <div className="border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Sessions (30d)</p>
          <p className="text-2xl font-semibold text-foreground">{recentSessionCount}</p>
        </div>
        <div className="border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Hours (30d)</p>
          <p className="text-2xl font-semibold text-foreground">{recentHours}</p>
        </div>
      </div>

      {/* Earnings (actual — past sessions only) */}
      <div className="border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Earnings</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted mb-1">This month</p>
            <p className="text-xl font-semibold text-foreground">${thisMonthEarnings.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">This year</p>
            <p className="text-xl font-semibold text-foreground">${thisYearEarnings.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">All time</p>
            <p className="text-xl font-semibold text-foreground">${allTimeEarnings.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Upcoming sessions */}
      <div className="border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Upcoming sessions</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">No sessions scheduled.</p>
        ) : (
          <>
            <ul className="divide-y divide-border -mx-1 mb-3">
              {upcoming.slice(0, 5).map(s => {
                const names = s.students.map(ss => ss.student.name).join(', ')
                const date = formatSessionDate(s.date, {
                  weekday: 'short', day: 'numeric', month: 'short',
                })
                const time = s.startTime ? formatSessionTime(s.startTime) : null
                const amount = Number(s.duration) * Number(s.rateCharged)
                return (
                  <li key={s.id} className="flex items-center justify-between px-1 py-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{names}</span>
                      <span className="text-xs text-muted">
                        {date}{time ? ` · ${time}` : ''} · {Number(s.duration)}h
                      </span>
                    </div>
                    <span className="text-sm text-muted">${amount.toFixed(0)}</span>
                  </li>
                )
              })}
            </ul>
            <p className="text-xs text-muted border-t border-border pt-3">
              Projected: <span className="font-medium text-foreground">${projectedEarnings.toFixed(0)}</span>
            </p>
          </>
        )}
      </div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Recent sessions</h2>
          <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden">
            {recentSessions.map(s => {
              const amount = Number(s.duration) * Number(s.rateCharged)
              const names = s.students.map(ss => ss.student.name).join(', ')
              const date = formatSessionDate(s.date, {
                weekday: 'short', day: 'numeric', month: 'short',
              })
              return (
                <li key={s.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-badge">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{names}</span>
                    <span className="text-xs text-muted">{date}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    ${amount.toFixed(2)}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
