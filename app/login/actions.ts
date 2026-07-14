'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export async function login(prevState: string | null, formData: FormData): Promise<string | null> {
  try {
    await signIn('credentials', {
      email: (formData.get('email') as string).trim().toLowerCase(),
      password: formData.get('password') as string,
      redirectTo: '/',
    })
    return null
  } catch (e) {
    if (e instanceof AuthError) return 'Invalid email or password.'
    throw e
  }
}
