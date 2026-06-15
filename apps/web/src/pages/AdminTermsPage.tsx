import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { API_BASE_URL } from '../config'

type Term = {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

export function AdminTermsPage() {
  const [terms, setTerms] = useState<Term[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', isActive: true })

  async function load() {
    const response = await fetch(`${API_BASE_URL}/api/terms`, { credentials: 'include' })
    const body = (await response.json()) as { data: Term[] }
    setTerms(body.data)
  }

  useEffect(() => {
    void load()
  }, [])

  async function addTerm(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/terms`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(data?.message ?? 'Could not add term')
      }

      setForm({ name: '', startDate: '', endDate: '', isActive: false })
      setMessage('Term added')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add term')
    }
  }

  async function setActive(term: Term) {
    setMessage(null)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/terms/${term.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      })

      if (!response.ok) {
        throw new Error('Could not activate term')
      }

      setMessage('Active term updated')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not activate term')
    }
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Terms</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Create terms and choose which term is active.</p>

        <form onSubmit={addTerm} className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4" placeholder="Term name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-[var(--border)] px-4 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
            Set as active term
          </label>
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4" type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} required />
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4" type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} required />
          <button type="submit" className="min-h-12 rounded-2xl bg-[var(--primary)] px-4 text-base font-semibold text-white">Add term</button>
        </form>

        <div className="mt-5 grid gap-3">
          {terms.map((term) => (
            <div key={term.id} className="grid gap-2 rounded-2xl border border-[var(--border)] p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{term.name}</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-[var(--text-muted)]">{term.isActive ? 'Active' : 'Archived'}</p>
              </div>
              <button
                type="button"
                className="min-h-12 rounded-2xl bg-[var(--success)] px-4 text-sm font-semibold text-white"
                onClick={() => void setActive(term)}
                disabled={term.isActive}
              >
                Mark active
              </button>
            </div>
          ))}
        </div>

        {message ? <p className="mt-4 text-sm text-[var(--success)]">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-[var(--error)]">{error}</p> : null}
      </div>
    </section>
  )
}
