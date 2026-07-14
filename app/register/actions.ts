'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export async function register(prevState: string | null, formData: FormData): Promise<string | null> {
  const firstName = (formData.get('firstName') as string).trim()
  const lastName = (formData.get('lastName') as string).trim()
  const name = `${firstName} ${lastName}`.trim()
  const email = (formData.get('email') as string).trim().toLowerCase()
  const password = formData.get('password') as string

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return 'An account with that email already exists.'

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { email, password: hashed, name } })

    // Claim any students that existed before auth was added
    await prisma.student.updateMany({
      where: { userId: null },
      data: { userId: user.id },
    })

    await signIn('credentials', { email, password, redirectTo: '/' })
    return null
  } catch (e) {
    if (e instanceof AuthError) return 'Something went wrong. Please try again.'
    throw e
  }
}
