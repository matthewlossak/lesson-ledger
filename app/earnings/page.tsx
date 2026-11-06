export const dynamic = 'force-dynamic'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { melbourneToday } from '@/lib/sessions'
import { addMonths, chartMonths, parseMonthKey, startOfMonth } from '@/lib/earnings'
import EarningsView from './EarningsView'

export default async function EarningsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month } = await searchParams
  const session = await auth()
  const userId = parseInt(session!.user.id)

  const now = new Date()
  const currentMonth = startOfMonth(melbourneToday(now))
  const selected = parseMonthKey(month) ?? currentMonth
  const months = chartMonths(selected, currentMonth)

  const sessions = await prisma.session.findMany({
    where: {
      students: { some: { student: { userId } } },
      date: { gte: months[0], lt: addMonths(months[months.length - 1], 1) },
    },
    select: { date: true, startTime: true, duration: true, rateCharged: true },
  })

  return (
    <EarningsView
      sessions={sessions.map(s => ({
        date: s.date,
        startTime: s.startTime,
        duration: Number(s.duration),
        rateCharged: Number(s.rateCharged),
      }))}
      selected={selected}
      currentMonth={currentMonth}
      now={now}
    />
  )
}
