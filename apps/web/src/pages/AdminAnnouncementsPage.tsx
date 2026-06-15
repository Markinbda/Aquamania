import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { API_BASE_URL } from '../config'

type Announcement = {
  id: string
  title: string
  body: string
  audience: 'ALL' | 'GROUP' | 'INSTRUCTORS'
  sentAt: string | null
}

export function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', body: '', audience: 'ALL' as Announcement['audience'] })

  async function load() {
    const response = await fetch(`${API_BASE_URL}/api/announcements`, { credentials: 'include' })
    const body = (await response.json()) as { data: Announcement[] }
    setItems(body.data)
  }

  useEffect(() => {
    void load()
  }, [])

  async function create(event: FormEvent) {
    event.preventDefault()

    const response = await fetch(`${API_BASE_URL}/api/announcements`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })

    if (response.ok) {
      setMessage('Announcement drafted')
      setForm({ title: '', body: '', audience: 'ALL' })
      await load()
    }
  }

  async function send(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/announcements/${id}/send`, {
      method: 'POST',
      credentials: 'include'
    })

    if (response.ok) {
      setMessage('Announcement sent')
      await load()
    }
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Announcements</h1>
        <form className="mt-4 grid gap-3" onSubmit={create}>
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4" placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <textarea className="rounded-2xl border border-[var(--border)] px-4 py-3" rows={5} placeholder="Message body" value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} required />
          <select className="min-h-12 rounded-2xl border border-[var(--border)] px-4" value={form.audience} onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value as Announcement['audience'] }))}>
            <option value="ALL">All</option>
            <option value="GROUP">Specific Group</option>
            <option value="INSTRUCTORS">Instructors</option>
          </select>
          <button type="submit" className="min-h-12 rounded-2xl bg-[var(--primary)] px-4 text-white">Save draft</button>
        </form>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="font-semibold text-[var(--text-primary)]">{item.title}</p>
            <p className="text-sm text-[var(--text-muted)]">Audience: {item.audience}</p>
            <p className="mt-2 text-sm text-[var(--text-primary)]">{item.body}</p>
            <button type="button" className="mt-3 min-h-12 rounded-2xl bg-[var(--accent)] px-4 text-sm font-semibold text-white" onClick={() => void send(item.id)}>
              {item.sentAt ? 'Resend' : 'Send'}
            </button>
          </div>
        ))}
      </div>

      {message ? <p className="text-sm text-[var(--success)]">{message}</p> : null}
    </section>
  )
}
