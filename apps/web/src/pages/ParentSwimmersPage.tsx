import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'

type Swimmer = { id: string; firstName: string; lastName: string; registrationStatus: string; group?: { name: string } | null }

export function ParentSwimmersPage() {
  const [items, setItems] = useState<Swimmer[]>([])

  useEffect(() => {
    void fetch(`${API_BASE_URL}/api/parent/swimmers`, { credentials: 'include' })
      .then((res) => res.json())
      .then((body: { data: Swimmer[] }) => setItems(body.data))
      .catch(() => setItems([]))
  }, [])

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Swimmers</h1>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-[var(--border)] p-4">
            <p className="font-semibold text-[var(--text-primary)]">{item.firstName} {item.lastName}</p>
            <p className="text-sm text-[var(--text-muted)]">Status: {item.registrationStatus}</p>
            <p className="text-sm text-[var(--text-muted)]">Group: {item.group?.name ?? 'Not assigned'}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
