export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { formatSessionDate } from '@/lib/sessions'

type Period = 'week' | 'month' | 'year' | 'all'

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Past 7 days', value: 'week' },
  { label: 'Past 30 days', value: 'month' },
  { label: 'Past year', value: 'year' },
  { label: 'All time', value: 'all' },
]

function getDateFilter(period: Period): { gte?: Date; lte?: Date } {
  if (period === 'all') return {}

  const now = new Date()
  now.setHours(23, 59, 59, 999)

  const daysAgo = (n: number) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    d.setHours(0, 0, 0, 0)
    return d
  }

  if (period === 'week') return { gte: daysAgo(7), lte: now }
  if (period === 'month') return { gte: daysAgo(30), lte: now }
  return { gte: daysAgo(365), lte: now }
}

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ period?: string }>
}) {
  const { id } = await params
  const { period: periodParam } = await searchParams

  const studentId = parseInt(id)
  if (isNaN(studentId)) notFound()

  const period = (PERIODS.find(p => p.value === periodParam)?.value ?? 'month') as Period

  const session = await auth()
  const userId = parseInt(session!.user.id)

  const student = await prisma.student.findFirst({ where: { id: studentId, userId } })
  if (!student) notFound()

  const dateFilter = getDateFilter(period)

  const sessions = await prisma.session.findMany({
    where: {
      students: { some: { studentId } },
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
    },
    include: {
      students: { include: { student: true } },
    },
    orderBy: { date: 'desc' },
  })

  const totalHours = sessions.reduce((sum, s) => sum + Number(s.duration), 0)
  const totalEarnings = sessions.reduce(
    (sum, s) => sum + Number(s.duration) * Number(s.rateCharged),
    0
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Student header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">{student.name}</h1>
        <p className="text-sm text-muted mt-1">
          {student.subjects.join(', ')} · {student.defaultRateTier === 'SENIOR' ? 'Senior' : 'Regular'}
        </p>
      </div>

      {/* Period filter — plain links, no JS required */}
      <div className="flex gap-2 mb-6">
        {PERIODS.map(p => (
          <Link
            key={p.value}
            href={`/students/${studentId}?period=${p.value}`}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              period === p.value
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-foreground border-border hover:border-muted'
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Sessions</p>
          <p className="text-2xl font-semibold text-foreground">{sessions.length}</p>
        </div>
        <div className="border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Hours</p>
          <p className="text-2xl font-semibold text-foreground">{totalHours}</p>
        </div>
        <div className="border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Earnings</p>
          <p className="text-2xl font-semibold text-foreground">${totalEarnings.toFixed(2)}</p>
        </div>
      </div>

      {/* Session list */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p>No sessions {period === 'all' ? 'yet' : 'in this period'}.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden">
          {sessions.map(session => {
            const duration = Number(session.duration)
            const rate = Number(session.rateCharged)
            const earnings = duration * rate
            const otherStudents = session.students
              .filter(ss => ss.studentId !== studentId)
              .map(ss => ss.student.name)
            const formattedDate = formatSessionDate(session.date, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })

            return (
              <li key={session.id} className="px-4 py-3 bg-white hover:bg-badge">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">{formattedDate}</span>
                    {otherStudents.length > 0 && (
                      <span className="text-sm text-muted">
                        with {otherStudents.join(', ')}
                      </span>
                    )}
                    {session.note && (
                      <span className="text-sm text-muted mt-0.5">{session.note}</span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0 ml-4">
                    <span className="font-medium text-foreground">${earnings.toFixed(2)}</span>
                    <span className="text-sm text-muted">{duration}h @ ${rate}/hr</span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
