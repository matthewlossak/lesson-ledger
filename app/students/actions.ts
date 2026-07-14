'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import type { RateTier } from '@/app/generated/prisma/client'

type StudentInput = {
  name: string
  subjects: string[]
  defaultRateTier: RateTier
}

async function currentUserId(): Promise<number> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')
  return parseInt(session.user.id)
}

export async function createStudent(input: StudentInput) {
  const userId = await currentUserId()
  await prisma.student.create({ data: { ...input, userId } })
  revalidatePath('/students')
}

export async function updateStudent(id: number, input: StudentInput) {
  const userId = await currentUserId()
  const student = await prisma.student.findFirst({ where: { id, userId } })
  if (!student) throw new Error('Not found')
  await prisma.student.update({ where: { id }, data: input })
  revalidatePath('/students')
}

export async function deleteStudent(id: number) {
  const userId = await currentUserId()
  const student = await prisma.student.findFirst({ where: { id, userId } })
  if (!student) throw new Error('Not found')
  await prisma.student.delete({ where: { id } })
  revalidatePath('/students')
}
