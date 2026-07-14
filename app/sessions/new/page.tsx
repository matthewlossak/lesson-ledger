export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import SessionForm from '../SessionForm'

export default async function NewSessionPage() {
  const session = await auth()
  const userId = parseInt(session!.user.id)
  const students = await prisma.student.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/sessions" className="text-sm text-muted hover:text-foreground transition-colors">
          ← Back to sessions
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">Log a session</h1>
      <SessionForm students={students} />
    </div>
  )
}
