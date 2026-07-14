export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import SessionList from './SessionList'
import ExportInvoiceForm from './ExportInvoiceForm'

export default async function SessionsPage() {
  const session = await auth()
  const userId = parseInt(session!.user.id)

  const [students, sessions] = await Promise.all([
    prisma.student.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
    prisma.session.findMany({
      where: { students: { some: { student: { userId } } } },
      include: {
        students: {
          include: { student: true },
        },
      },
      orderBy: { date: 'desc' },
    }),
  ])

  const sessionRows = sessions.map(s => ({
    id: s.id,
    date: s.date.toISOString(),
    startTime: s.startTime,
    duration: Number(s.duration),
    rateCharged: Number(s.rateCharged),
    note: s.note,
    students: s.students.map(ss => ({
      studentId: ss.studentId,
      student: { name: ss.student.name },
    })),
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-foreground">Sessions</h1>
        <Link
          href="/sessions/new"
          className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
        >
          + Add session
        </Link>
      </div>
      <div className="flex justify-end mb-6">
        <ExportInvoiceForm />
      </div>
      <SessionList sessions={sessionRows} allStudents={students} />
    </div>
  )
}
