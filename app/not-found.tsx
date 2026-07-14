import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <p className="text-5xl font-semibold text-border mb-4">404</p>
      <p className="text-lg font-medium text-foreground mb-2">Page not found</p>
      <p className="text-sm text-muted mb-8">This page doesn&apos;t exist or you don&apos;t have access to it.</p>
      <Link
        href="/"
        className="inline-flex text-sm font-medium text-foreground hover:text-primary border border-border rounded-lg px-4 py-2 hover:bg-badge transition-colors"
      >
        ← Go home
      </Link>
    </div>
  )
}
