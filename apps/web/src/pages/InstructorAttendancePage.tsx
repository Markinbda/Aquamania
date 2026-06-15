import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { API_BASE_URL } from '../config'

type SessionDetail = {
  id: string
  date: string
  group: {
    name: string
    swimmers: Array<{ id: string; firstName: string; lastName: string }>
  }
}

export function InstructorAttendancePage() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    void fetch(`${API_BASE_URL}/api/sessions/${id}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((body: SessionDetail) => {
        setSession(body)
        setAttendance(
          Object.fromEntries(body.group.swimmers.map((swimmer) => [swimmer.id, false]))
        )
      })
      .catch(() => setSession(null))
  }, [id])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!id || !session) return

    const payload = {
      attendance: session.group.swimmers.map((swimmer) => ({
        swimmerId: swimmer.id,
        present: Boolean(attendance[swimmer.id])
      }))
    }

    const response = await fetch(`${API_BASE_URL}/api/instructor/sessions/${id}/attendance`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      setMessage('Attendance saved')
    }
  }

  if (!session) {
    return <section className="rounded-3xl border border-[var(--border)] bg-white p-5">Loading session...</section>
  }

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Attendance - {session.group.name}</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{new Date(session.date).toLocaleString()}</p>

      <form className="mt-4 grid gap-3" onSubmit={submit}>
        {session.group.swimmers.map((swimmer) => {
          const present = Boolean(attendance[swimmer.id])
          return (
            <button
              key={swimmer.id}
              type="button"
              className={`min-h-12 rounded-2xl border px-4 text-left text-base font-semibold ${present ? 'border-[var(--success)] bg-[var(--success)]/10' : 'border-[var(--error)] bg-[var(--error)]/10'}`}
              onClick={() => setAttendance((prev) => ({ ...prev, [swimmer.id]: !present }))}
            >
              {swimmer.firstName} {swimmer.lastName} - {present ? 'Present' : 'Absent'}
            </button>
          )
        })}

        <button type="submit" className="min-h-12 rounded-2xl bg-[var(--primary)] px-4 text-white">Save attendance</button>
      </form>

      {message ? <p className="mt-4 text-sm text-[var(--success)]">{message}</p> : null}
    </section>
  )
}
