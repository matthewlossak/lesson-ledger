'use client'

import { useState } from 'react'
import Link from 'next/link'

const links = [
  { href: '/students', label: 'Students' },
  { href: '/sessions', label: 'Sessions' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/settings', label: 'Settings' },
]

export default function HeaderNav({
  userName,
  signOutAction,
}: {
  userName: string
  signOutAction: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-6">
      <Link
        href="/"
        onClick={() => setOpen(false)}
        className="font-semibold text-white hover:text-header-muted transition-colors shrink-0"
      >
        LessonLedger
      </Link>

      {/* Desktop nav */}
      <nav className="hidden sm:flex items-center gap-4">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-header-muted hover:text-white transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="hidden sm:flex ml-auto items-center gap-4">
        <span className="text-sm text-header-muted">{userName}</span>
        <form action={signOutAction}>
          <button type="submit" className="text-sm text-header-muted hover:text-white transition-colors">
            Sign out
          </button>
        </form>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden ml-auto">
        <button
          onClick={() => setOpen(o => !o)}
          className="p-2 text-header-muted hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="17" y2="6" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="14" x2="17" y2="14" />
            </svg>
          )}
        </button>

        {open && (
          <div className="absolute top-14 left-0 right-0 bg-white border-b border-border shadow-sm z-50 px-4 py-3 flex flex-col gap-1">
            <p className="text-xs text-muted px-3 pb-2">{userName}</p>
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm text-foreground hover:bg-badge rounded-lg px-3 py-2 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full text-left text-sm text-muted hover:bg-badge rounded-lg px-3 py-2 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
