'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

type SessionInput = {
  date: string
  startTime: string
  duration: string
  rateCharged: string
  note: string
  studentIds: number[]
}

async function currentUserId(): Promise<number> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')
  return parseInt(session.user.id)
}

async function verifyStudentsOwned(userId: number, studentIds: number[]) {
  const count = await prisma.student.count({
    where: { id: { in: studentIds }, userId },
  })
  if (count !== studentIds.length) throw new Error('Unauthorized')
}

function revalidateSessions() {
  revalidatePath('/')
  revalidatePath('/sessions')
  revalidatePath('/calendar')
  revalidatePath('/students', 'layout')
}

export async function createSession(input: SessionInput) {
  const userId = await currentUserId()
  await verifyStudentsOwned(userId, input.studentIds)
  await prisma.session.create({
    data: {
      date: new Date(input.date),
      startTime: input.startTime.trim() || null,
      duration: parseFloat(input.duration),
      rateCharged: parseFloat(input.rateCharged),
      note: input.note.trim() || null,
      students: {
        create: input.studentIds.map(studentId => ({ studentId })),
      },
    },
  })
  revalidateSessions()
}

export async function updateSession(id: number, input: SessionInput) {
  const userId = await currentUserId()
  await verifyStudentsOwned(userId, input.studentIds)
  await prisma.session.update({
    where: { id },
    data: {
      date: new Date(input.date),
      startTime: input.startTime.trim() || null,
      duration: parseFloat(input.duration),
      rateCharged: parseFloat(input.rateCharged),
      note: input.note.trim() || null,
      students: {
        deleteMany: {},
        create: input.studentIds.map(studentId => ({ studentId })),
      },
    },
  })
  revalidateSessions()
}

export async function deleteSession(id: number) {
  const userId = await currentUserId()
  const session = await prisma.session.findFirst({
    where: {
      id,
      students: { some: { student: { userId } } },
    },
  })
  if (!session) throw new Error('Not found')
  await prisma.session.delete({ where: { id } })
  revalidateSessions()
}
