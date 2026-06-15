import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'

type Session = { id: string; date: string; group: { name: string } }

export function InstructorDashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    void fetch(`${API_BASE_URL}/api/instructor/dashboard`, { credentials: 'include' })
      .then((res) => res.json())
      .then((body: { sessions: Session[] }) => setSessions(body.sessions))
      .catch(() => setSessions([]))
  }, [])

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Today&apos;s Sessions</h1>
      <div className="mt-4 grid gap-3">
        {sessions.map((session) => (
          <div key={session.id} className="rounded-2xl border border-[var(--border)] p-4">
            <p className="font-semibold text-[var(--text-primary)]">{session.group.name}</p>
            <p className="text-sm text-[var(--text-muted)]">{new Date(session.date).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
