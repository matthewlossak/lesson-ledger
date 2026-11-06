'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { monthKey, parseMonthKey } from '@/lib/earnings'

type SessionInput = {
  date: string
  startTime: string
  duration: string
  rateCharged: string
  note: string
  studentIds: number[]
  countsInMonth?: string
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

async function findOwnedSession(userId: number, id: number) {
  const session = await prisma.session.findFirst({
    where: {
      id,
      students: { some: { student: { userId } } },
    },
  })
  if (!session) throw new Error('Not found')
  return session
}

// Moving a session to the month it happened in is the same as not moving it.
function normaliseCountsInMonth(month: string | null | undefined, date: Date): string | null {
  const parsed = parseMonthKey(month ?? undefined)
  if (!parsed) return null
  const key = monthKey(parsed)
  return key === monthKey(date) ? null : key
}

function revalidateSessions() {
  revalidatePath('/')
  revalidatePath('/sessions')
  revalidatePath('/calendar')
  revalidatePath('/earnings')
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
  await findOwnedSession(userId, id)
  await verifyStudentsOwned(userId, input.studentIds)
  await prisma.session.update({
    where: { id },
    data: {
      date: new Date(input.date),
      startTime: input.startTime.trim() || null,
      duration: parseFloat(input.duration),
      rateCharged: parseFloat(input.rateCharged),
      note: input.note.trim() || null,
      countsInMonth: normaliseCountsInMonth(input.countsInMonth, new Date(input.date)),
      students: {
        deleteMany: {},
        create: input.studentIds.map(studentId => ({ studentId })),
      },
    },
  })
  revalidateSessions()
}

// Pass null to put a session back in the month it happened.
export async function moveSessionToMonth(id: number, month: string | null) {
  const userId = await currentUserId()
  const session = await findOwnedSession(userId, id)
  await prisma.session.update({
    where: { id },
    data: { countsInMonth: normaliseCountsInMonth(month, session.date) },
  })
  revalidateSessions()
}

export async function deleteSession(id: number) {
  const userId = await currentUserId()
  await findOwnedSession(userId, id)
  await prisma.session.delete({ where: { id } })
  revalidateSessions()
}
