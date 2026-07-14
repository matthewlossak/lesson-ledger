'use client'

import { useActionState } from 'react'
import { login } from './actions'

const inputClass = 'w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary'

export default function LoginForm() {
  const [error, formAction, isPending] = useActionState(login, null)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Email</label>
        <input name="email" type="email" required placeholder="you@example.com" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Password</label>
        <input name="password" type="password" required placeholder="Your password" className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors mt-2"
      >
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
