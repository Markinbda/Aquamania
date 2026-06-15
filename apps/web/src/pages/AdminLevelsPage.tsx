import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { API_BASE_URL } from '../config'

type ProgramLevel = {
  id: string
  name: string
  description: string | null
  minAge: number | null
  maxAge: number | null
  sortOrder: number
  isActive: boolean
}

export function AdminLevelsPage() {
  const [levels, setLevels] = useState<ProgramLevel[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', minAge: '', maxAge: '', sortOrder: '0' })

  async function load() {
    const response = await fetch(`${API_BASE_URL}/api/program-levels`, { credentials: 'include' })
    const body = (await response.json()) as { data: ProgramLevel[] }
    setLevels(body.data)
  }

  useEffect(() => {
    void load()
  }, [])

  async function addLevel(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/program-levels`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          minAge: form.minAge ? Number(form.minAge) : null,
          maxAge: form.maxAge ? Number(form.maxAge) : null,
          sortOrder: Number(form.sortOrder || 0)
        })
      })

      if (!response.ok) {
        throw new Error('Could not add programme level')
      }

      setForm({ name: '', description: '', minAge: '', maxAge: '', sortOrder: '0' })
      setMessage('Programme level added')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add programme level')
    }
  }

  async function updateLevel(level: ProgramLevel, updates: Partial<ProgramLevel>) {
    setMessage(null)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/program-levels/${level.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Could not update programme level')
      }

      setMessage('Programme level updated')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update programme level')
    }
  }

  async function deactivate(level: ProgramLevel) {
    setMessage(null)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/program-levels/${level.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Could not deactivate programme level')
      }

      setMessage('Programme level deactivated')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not deactivate programme level')
    }
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Programme Levels</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Add, reorder, and deactivate programme levels.</p>

        <form onSubmit={addLevel} className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4" placeholder="Level name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4" placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4" placeholder="Min age (months)" value={form.minAge} onChange={(e) => setForm((p) => ({ ...p, minAge: e.target.value }))} />
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4" placeholder="Max age (months)" value={form.maxAge} onChange={(e) => setForm((p) => ({ ...p, maxAge: e.target.value }))} />
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4" placeholder="Sort order" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))} />
          <button type="submit" className="min-h-12 rounded-2xl bg-[var(--primary)] px-4 text-base font-semibold text-white">Add level</button>
        </form>

        <div className="mt-5 grid gap-3">
          {levels.map((level) => (
            <div key={level.id} className="grid gap-2 rounded-2xl border border-[var(--border)] p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{level.name}</p>
                <p className="text-sm text-[var(--text-muted)]">Sort: {level.sortOrder} | {level.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <input
                className="min-h-12 rounded-2xl border border-[var(--border)] px-4"
                type="number"
                defaultValue={level.sortOrder}
                onBlur={(e) => void updateLevel(level, { sortOrder: Number(e.target.value) })}
              />
              <button
                type="button"
                className="min-h-12 rounded-2xl bg-[var(--error)] px-4 text-sm font-semibold text-white"
                onClick={() => void deactivate(level)}
                disabled={!level.isActive}
              >
                Deactivate
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
