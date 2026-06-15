import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'

type PortalSimpleListPageProps = {
  title: string
  endpoint: '/api/parent/photos' | '/api/parent/announcements' | '/api/consent-forms'
}

export function PortalSimpleListPage({ title, endpoint }: PortalSimpleListPageProps) {
  const [items, setItems] = useState<unknown[]>([])

  useEffect(() => {
    void fetch(`${API_BASE_URL}${endpoint}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((body: { data?: unknown[] }) => setItems(body.data ?? []))
      .catch(() => setItems([]))
  }, [endpoint])

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{items.length} item(s)</p>
      <pre className="mt-4 overflow-auto rounded-2xl bg-[var(--bg)] p-4 text-xs text-[var(--text-muted)]">{JSON.stringify(items, null, 2)}</pre>
    </section>
  )
}
