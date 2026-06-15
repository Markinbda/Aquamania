import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../config'

type GroupSchedule = {
  id: string
  name: string
  sessions: Array<{ id: string; date: string }>
}

export function InstructorSchedulePage() {
  const [groups, setGroups] = useState<GroupSchedule[]>([])

  useEffect(() => {
    void fetch(`${API_BASE_URL}/api/instructor/schedule`, { credentials: 'include' })
      .then((res) => res.json())
      .then((body: { data: GroupSchedule[] }) => setGroups(body.data))
      .catch(() => setGroups([]))
  }, [])

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Weekly Schedule</h1>
      <div className="mt-4 grid gap-3">
        {groups.map((group) => (
          <div key={group.id} className="rounded-2xl border border-[var(--border)] p-4">
            <p className="font-semibold text-[var(--text-primary)]">{group.name}</p>
            <ul className="mt-2 grid gap-2 text-sm text-[var(--text-muted)]">
              {group.sessions.map((session) => (
                <li key={session.id}>
                  {new Date(session.date).toLocaleString()} {' '}
                  <Link to={`/instructor/sessions/${session.id}/attendance`} className="font-semibold text-[var(--primary-dark)]">Mark attendance</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
