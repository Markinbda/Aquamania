import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { API_BASE_URL } from '../config'

type Role = 'ADMIN' | 'INSTRUCTOR' | 'PARENT'

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; role: Role }

type RequireAuthProps = {
  allow: Role[]
}

export function RequireAuth({ allow }: RequireAuthProps) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let active = true

    async function check() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' })
        if (!response.ok) {
          if (active) setState({ status: 'unauthenticated' })
          return
        }
        const body = (await response.json()) as { user: { role: Role } }
        if (active) setState({ status: 'authenticated', role: body.user.role })
      } catch {
        if (active) setState({ status: 'unauthenticated' })
      }
    }

    void check()
    return () => {
      active = false
    }
  }, [])

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <p className="text-sm text-[var(--text-muted)]">Checking your session…</p>
      </div>
    )
  }

  if (state.status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  if (!allow.includes(state.role)) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
