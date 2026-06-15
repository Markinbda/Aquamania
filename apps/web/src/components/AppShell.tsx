import { Link, Outlet } from 'react-router-dom'

type AppShellProps = {
  role: 'Admin' | 'Parent' | 'Instructor'
  mobileTabs?: boolean
}

const mobileTabLinks = [
  { label: 'Home', to: '.' },
  { label: 'Schedule', to: 'schedule' },
  { label: 'Payments', to: 'payments' }
]

export function AppShell({ role, mobileTabs = false }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/90 px-4 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="text-lg font-bold tracking-tight text-[var(--primary-dark)]">
            Aquamania Swimming
          </Link>
          <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-sm font-semibold text-[var(--primary-dark)]">
            {role} Portal
          </span>
        </div>
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
