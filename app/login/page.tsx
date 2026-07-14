import Link from 'next/link'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Sign in</h1>
        <p className="text-sm text-muted mb-8">Welcome back to LessonLedger.</p>
        <LoginForm />
        <p className="text-sm text-muted mt-6 text-center">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-foreground font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
