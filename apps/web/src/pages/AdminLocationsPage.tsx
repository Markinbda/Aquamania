import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { API_BASE_URL } from '../config'

type PoolLocation = {
  id: string
  name: string
  address: string | null
  notes: string | null
  isActive: boolean
}

export function AdminLocationsPage() {
  const [locations, setLocations] = useState<PoolLocation[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', address: '', notes: '' })

  async function load() {
    const response = await fetch(`${API_BASE_URL}/api/pool-locations`, { credentials: 'include' })
    const body = (await response.json()) as { data: PoolLocation[] }
    setLocations(body.data)
  }

  useEffect(() => {
    void load()
  }, [])

  async function addLocation(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/pool-locations`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          address: form.address || undefined,
          notes: form.notes || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Could not add pool location')
      }

      setForm({ name: '', address: '', notes: '' })
      setMessage('Pool location added')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add pool location')
    }
  }

  async function deactivate(location: PoolLocation) {
    setMessage(null)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/pool-locations/${location.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Could not deactivate pool location')
      }

      setMessage('Pool location deactivated')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not deactivate pool location')
    }
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pool Locations</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Add, update, and deactivate locations used for groups.</p>

        <form onSubmit={addLocation} className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4" placeholder="Location name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4" placeholder="Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4 md:col-span-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          <button type="submit" className="min-h-12 rounded-2xl bg-[var(--primary)] px-4 text-base font-semibold text-white">Add location</button>
        </form>

        <div className="mt-5 grid gap-3">
          {locations.map((location) => (
            <div key={location.id} className="grid gap-2 rounded-2xl border border-[var(--border)] p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{location.name}</p>
                <p className="text-sm text-[var(--text-muted)]">{location.address ?? 'No address provided'}</p>
                <p className="text-sm text-[var(--text-muted)]">{location.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <button
                type="button"
                className="min-h-12 rounded-2xl bg-[var(--error)] px-4 text-sm font-semibold text-white"
                onClick={() => void deactivate(location)}
                disabled={!location.isActive}
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
