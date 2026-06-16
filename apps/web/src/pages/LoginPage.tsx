import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'

type Role = 'ADMIN' | 'INSTRUCTOR' | 'PARENT'

type LoginResponse = {
  user: {
    id: string
    email: string
    role: Role
    firstName: string
    lastName: string
  }
}

const roleHome: Record<Role, string> = {
  ADMIN: '/admin',
  INSTRUCTOR: '/instructor',
  PARENT: '/portal'
}

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage(null)
    setSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.trim(), password })
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(body?.message ?? 'Email or password is incorrect.')
      }

      const body = (await response.json()) as LoginResponse
      navigate(roleHome[body.user.role] ?? '/', { replace: true })
    } catch (error) {
      if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
        setErrorMessage(`Cannot reach the API at ${API_BASE_URL}. Please try again shortly.`)
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Sign in failed.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-10 md:px-8">
      <section className="mx-auto w-full max-w-md rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm md:p-8">
        <Link to="/" className="text-sm font-semibold text-[var(--primary-dark)]">
          ← Back to home
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">Sign In</h1>
        <p className="mt-2 text-base text-[var(--text-muted)]">
          Sign in to manage registrations, schedules, and your swimmer details.
        </p>

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-[var(--text-primary)]">
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="min-h-12 rounded-2xl border border-[var(--border)] px-4"
              placeholder="you@example.com"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[var(--text-primary)]">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="min-h-12 rounded-2xl border border-[var(--border)] px-4"
              placeholder="Your password"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-2xl border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || !email.trim() || password.length < 8}
            className="min-h-12 rounded-2xl bg-[var(--primary)] px-4 text-base font-semibold text-white disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          New here?{' '}
          <Link to="/register" className="font-semibold text-[var(--primary-dark)]">
            Register a swimmer
          </Link>
        </p>
      </section>
    </div>
  )
}
