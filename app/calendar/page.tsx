export const dynamic = 'force-dynamic'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import CalendarView from './CalendarView'

export default async function CalendarPage() {
  const session = await auth()
  const userId = parseInt(session!.user.id)

  const sessions = await prisma.session.findMany({
    where: { students: { some: { student: { userId } } } },
    include: { students: { include: { student: true } } },
    orderBy: { date: 'asc' },
  })

  const calendarSessions = sessions.map(s => ({
    id: s.id,
    date: s.date.toISOString(),
    startTime: s.startTime,
    duration: Number(s.duration),
    rateCharged: Number(s.rateCharged),
    studentNames: s.students.map(ss => ss.student.name).join(', '),
  }))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-foreground mb-6">Calendar</h1>
      <div className="border border-border rounded-xl bg-white p-4">
        <CalendarView sessions={calendarSessions} />
      </div>
    </div>
  )
}
