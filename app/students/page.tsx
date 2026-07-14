export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import StudentList from './StudentList'

export default async function StudentsPage() {
  const session = await auth()
  const userId = parseInt(session!.user.id)
  const students = await prisma.student.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6 text-foreground">Students</h1>
      <StudentList students={students} />
    </div>
  )
}
