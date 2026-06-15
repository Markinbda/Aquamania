import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { API_BASE_URL } from '../config'

type Photo = {
  id: string
  groupId: string
  url: string
  caption: string | null
}

type Group = { id: string; name: string }

export function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [form, setForm] = useState({ groupId: '', url: '', caption: '' })
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    const [photosRes, groupsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/photos`, { credentials: 'include' }),
      fetch(`${API_BASE_URL}/api/groups`, { credentials: 'include' })
    ])
    const photosBody = (await photosRes.json()) as { data: Photo[] }
    const groupsBody = (await groupsRes.json()) as { data: Group[] }
    setPhotos(photosBody.data)
    setGroups(groupsBody.data)
  }

  useEffect(() => {
    void load()
  }, [])

  async function upload(event: FormEvent) {
    event.preventDefault()

    const response = await fetch(`${API_BASE_URL}/api/photos/upload`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })

    if (response.ok) {
      setMessage('Photo registered')
      setForm({ groupId: '', url: '', caption: '' })
      await load()
    }
  }

  async function remove(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/photos/${id}`, { method: 'DELETE', credentials: 'include' })
    if (response.ok) {
      setMessage('Photo deleted')
      await load()
    }
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Photo Management</h1>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={upload}>
          <select className="min-h-12 rounded-2xl border border-[var(--border)] px-4" value={form.groupId} onChange={(e) => setForm((p) => ({ ...p, groupId: e.target.value }))} required>
            <option value="">Group</option>
            {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
          </select>
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4" placeholder="Photo URL" value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} required />
          <input className="min-h-12 rounded-2xl border border-[var(--border)] px-4 md:col-span-2" placeholder="Caption" value={form.caption} onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))} />
          <button type="submit" className="min-h-12 rounded-2xl bg-[var(--primary)] px-4 text-white">Add photo</button>
        </form>
      </div>

      <div className="grid gap-3">
        {photos.map((photo) => (
          <div key={photo.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="text-sm text-[var(--text-muted)]">Group: {photo.groupId}</p>
            <a href={photo.url} target="_blank" rel="noreferrer" className="font-semibold text-[var(--primary-dark)]">{photo.url}</a>
            <p className="text-sm text-[var(--text-muted)]">{photo.caption ?? 'No caption'}</p>
            <button type="button" className="mt-3 min-h-12 rounded-2xl bg-[var(--error)] px-4 text-sm font-semibold text-white" onClick={() => void remove(photo.id)}>Delete</button>
          </div>
        ))}
      </div>

      {message ? <p className="text-sm text-[var(--success)]">{message}</p> : null}
    </section>
  )
}
