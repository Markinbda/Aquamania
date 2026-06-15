import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'

type DashboardData = {
  parent: { firstName: string; lastName: string }
  swimmers: Array<{ id: string; firstName: string; lastName: string; group?: { name: string } | null }>
  outstandingPayments: Array<{ id: string; description: string; amountDue: number; amountPaid: number; status: string }>
}

export function ParentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    void fetch(`${API_BASE_URL}/api/parent/dashboard`, { credentials: 'include' })
      .then((res) => res.json())
      .then((body) => setData(body as DashboardData))
      .catch(() => setData(null))
  }, [])

  if (!data) {
    return <section className="rounded-3xl border border-[var(--border)] bg-white p-5">Loading dashboard...</section>
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome {data.parent.firstName}</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Your swimmers, schedule, and outstanding payments at a glance.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border)] bg-white p-5">
          <h2 className="font-semibold text-[var(--text-primary)]">My swimmers</h2>
          <ul className="mt-2 grid gap-2 text-sm">
            {data.swimmers.map((swimmer) => <li key={swimmer.id}>{swimmer.firstName} {swimmer.lastName} - {swimmer.group?.name ?? 'No group assigned'}</li>)}
          </ul>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-white p-5">
          <h2 className="font-semibold text-[var(--text-primary)]">Outstanding payments</h2>
          <ul className="mt-2 grid gap-2 text-sm">
            {data.outstandingPayments.length === 0 ? <li>All payments are up to date.</li> : null}
            {data.outstandingPayments.map((payment) => (
              <li key={payment.id}>{payment.description} - ${payment.amountDue - payment.amountPaid} ({payment.status})</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
