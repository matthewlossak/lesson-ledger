'use client'

import { useActionState } from 'react'
import { register } from './actions'

const inputClass = 'w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary'

export default function RegisterForm() {
  const [error, formAction, isPending] = useActionState(register, null)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-foreground mb-1">First name</label>
          <input name="firstName" type="text" required placeholder="Jane" className={inputClass} />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-foreground mb-1">Last name</label>
          <input name="lastName" type="text" required placeholder="Smith" className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Email</label>
        <input name="email" type="email" required placeholder="you@example.com" className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Password</label>
        <input name="password" type="password" required minLength={8} placeholder="At least 8 characters" className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors mt-2"
      >
        {isPending ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
