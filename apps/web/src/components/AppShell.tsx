import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'

type AppShellProps = {
  role: 'Admin' | 'Parent' | 'Instructor'
  mobileTabs?: boolean
}

const mobileTabLinks = [
  { label: 'Home', to: '.' },
  { label: 'Schedule', to: 'schedule' },
  { label: 'Payments', to: 'payments' }
]

const navLinksByRole: Record<AppShellProps['role'], Array<{ label: string; to: string }>> = {
  Admin: [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Registrations', to: '/admin/registrations' },
    { label: 'Documents', to: '/admin/documents' },
    { label: 'Swimmers', to: '/admin/swimmers' },
    { label: 'Groups', to: '/admin/groups' },
    { label: 'Instructors', to: '/admin/instructors' },
    { label: 'Payments', to: '/admin/payments' },
    { label: 'Announcements', to: '/admin/announcements' }
  ],
  Parent: [
    { label: 'Dashboard', to: '/portal' },
    { label: 'Swimmers', to: '/portal/swimmers' },
    { label: 'Schedule', to: '/portal/schedule' },
    { label: 'Payments', to: '/portal/payments' }
  ],
  Instructor: [
    { label: 'Dashboard', to: '/instructor' },
    { label: 'Schedule', to: '/instructor/schedule' }
  ]
}

export function AppShell({ role, mobileTabs = false }: AppShellProps) {
  const navigate = useNavigate()
  const navLinks = navLinksByRole[role]

  async function signOut() {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' })
    } catch {
      // Even if the request fails, send the user back to the login screen.
    }
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/90 px-4 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link to="/" className="text-lg font-bold tracking-tight text-[var(--primary-dark)]">
            Aquamania Swimming
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-sm font-semibold text-[var(--primary-dark)]">
              {role} Portal
            </span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-full border border-[var(--border)] px-3 py-1 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--primary)]/50"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto mt-3 hidden max-w-6xl flex-wrap gap-2 md:flex">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === `/${role.toLowerCase()}`}
              className={({ isActive }) =>
                `rounded-full px-3 py-1 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--text-muted)] hover:bg-[var(--primary)]/10'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 md:px-8 md:pb-10">
        <Outlet />
      </main>

      {mobileTabs ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-white md:hidden">
          <ul className="grid grid-cols-3">
            {mobileTabLinks.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex min-h-12 items-center justify-center text-sm font-medium text-[var(--text-primary)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  )
}
