import Link from 'next/link'
import RegisterForm from './RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Create an account</h1>
        <p className="text-sm text-muted mb-8">Start tracking your tutoring sessions.</p>
        <RegisterForm />
        <p className="text-sm text-muted mt-6 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-foreground font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
